import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createReadStream } from "node:fs";
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";

export async function createTranscriptionRoute(app: FastifyInstance){
    app.post('/videos/:videoId/transcription', async (req) => {
        const paramsSchema = z.object({
            videoId: z.string().uuid(),
        })

        const { videoId } = paramsSchema.parse(req.params) //valida se o paramsSchema segue o formato definido

        const bodySchema = z.object({
            prompt: z.string(),
        })

        const { prompt } = bodySchema.parse(req.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId,
            }
        })

        const videoPath = video.path
        const audioReadStream = createReadStream(videoPath)

        const response = await openai.audio.transcriptions.create({
            file: audioReadStream,
            model: 'whisper-1', //modelo da openai para transcrever aúdio em texto
            language: 'pt', //idioma principal 
            response_format: 'json',
            temperature: 0, //chance de acertividade 0 até 1
            prompt //palavras chaves que estão sendo passadas junto da requisição

        }) 

        const transcription = response.text

        await prisma.video.update({
            where: {
                id: videoId,
            },
            data: {
                transcription,
            }
        })

        return { transcription }
    })
}