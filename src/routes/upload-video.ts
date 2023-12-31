import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart"
import path from "node:path"; //vem de dentro do node
import { randomUUID } from "node:crypto"
import fs from "node:fs"
import { pipeline } from "node:stream" //aguarda upload de arquivo finalizar por completo 
import { promisify } from "node:util"; //função util transforma apis mais antigas do node que tem callback para usar promisses
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance){

    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1_048_576 * 25 //aumenta o limite para 25mb
        }
    })
   
    app.post('/videos', async (request, reply) => {
        const data = await request.file()

        if(!data){
            return reply.status(400).send({ error: 'Missing file input.' })
        }

        const extension = path.extname(data.filename)

        if(extension != '.mp3'){
            return reply.status(400).send({ error: 'Invalid input type, please upload a MP3.' })
        }

        const fileBaseName = path.basename(data.filename, extension)
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName) 

        await pump(data.file, fs.createWriteStream(uploadDestination))//aguardar o upload e escrever o arquivo com o "pump" 

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination,
            }
        })

        return {
            video,
        }
    })
}