// Generate TTS audio for all listening questions and store URLs in diagramData
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

// Extract the spoken transcript from the question text
function extractTranscript(text) {
  // Get content between [Transcript]: or [Audio transcript excerpt]: quotes
  const match = text.match(/\[(?:Transcript|Audio transcript excerpt)\]:\s*[""](.+?)[""](?:\s*Professor:|$)/s);
  if (match) return match[1].trim();
  // Fallback: get everything after the last [Transcript]:
  const fallback = text.match(/\[(?:Transcript|Audio transcript excerpt)[^\]]*\]:\s*([\s\S]+)/);
  if (fallback) return fallback[1].replace(/^[""]|[""]$/g, '').trim();
  return text.substring(0, 500);
}

// For TOEFL conversation — extract both sides
function extractDialogue(text) {
  const t = extractTranscript(text);
  return t;
}

const AUDIO_DIR = '/home/work/psychometric-audio';
fs.mkdirSync(AUDIO_DIR, { recursive: true });

async function main() {
  const questions = await p.question.findMany({
    where: { category: { slug: { in: ['ielts-listening', 'toefl-listening'] } } },
    select: { id: true, text: true, diagramData: true, category: { select: { slug: true } } }
  });

  console.log(`Generating audio for ${questions.length} listening questions...\n`);

  for (const q of questions) {
    const transcript = extractDialogue(q.text);
    const outPath = path.join(AUDIO_DIR, `${q.id}.mp3`);

    const isConversation = q.text.includes('Professor:') || q.text.includes('student talking');
    const voice = isConversation ? 'professional female voice, clear British English accent' : 
      q.category.slug === 'ielts-listening' ? 'clear British English accent, neutral tone' : 
      'clear American English accent, academic lecture style';

    console.log(`  Generating: ${q.id} (${q.category.slug})`);
    console.log(`  Transcript: ${transcript.substring(0, 80)}...`);

    try {
      execSync(
        `gsk audio ${JSON.stringify(transcript)} -m "elevenlabs/v3-tts" -r ${JSON.stringify(voice)} -o "${outPath}"`,
        { stdio: 'pipe', timeout: 120000 }
      );
      
      if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
        throw new Error('Audio file too small or missing');
      }

      // Upload the audio to get a public URL
      console.log(`  Uploading...`);
      const uploadOut = execSync(`gsk upload "${outPath}"`, { encoding: 'utf8', timeout: 60000 });
      const urlMatch = uploadOut.match(/https?:\/\/[^\s"]+/);
      if (!urlMatch) throw new Error('No URL in upload output: ' + uploadOut.substring(0, 200));
      const audioUrl = urlMatch[0].trim();

      console.log(`  URL: ${audioUrl.substring(0, 80)}...`);

      // Update the question's diagramData with the audio URL
      const existing = q.diagramData || {};
      await p.question.update({
        where: { id: q.id },
        data: {
          diagramData: {
            ...existing,
            audioUrl,
            audioLabel: q.category.slug === 'ielts-listening' ? 'IELTS Listening Audio' : 'TOEFL Listening Audio',
          }
        }
      });
      console.log(`  ✅ Done\n`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message.substring(0, 100)}\n`);
    }
  }

  // Verify
  const updated = await p.question.findMany({
    where: { category: { slug: { in: ['ielts-listening', 'toefl-listening'] } } },
    select: { id: true, diagramData: true }
  });
  const withAudio = updated.filter(q => q.diagramData?.audioUrl);
  console.log(`\n${withAudio.length}/${updated.length} questions now have audio URLs`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
