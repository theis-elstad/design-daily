type SubmissionData = {
  date: string
  staticCount: number
  videoCount: number
  productivity: number | null
  quality: number | null
  judgeComment: string | null
  designerComment: string | null
}

export function judgeContextPrompt(
  designerName: string,
  recentSubmissions: SubmissionData[],
  recentFeedback: string[]
): { system: string; user: string } {
  return {
    system: `You are an expert design judge assistant. You help design leads give better, more contextual feedback to their team members. Be specific, constructive, and encouraging. Keep your response concise — 3-5 bullet points.`,
    user: `I'm about to rate a submission from ${designerName}. Help me give better feedback by analyzing their recent work patterns.

Recent submissions (newest first):
${recentSubmissions
  .map(
    (s) =>
      `- ${s.date}: ${s.staticCount} statics, ${s.videoCount} videos | Productivity: ${s.productivity ?? 'unrated'}, Quality: ${s.quality ?? 'unrated'}${s.judgeComment ? ` | Feedback: "${s.judgeComment}"` : ''}${s.designerComment ? ` | Designer note: "${s.designerComment}"` : ''}`
  )
  .join('\n')}

${recentFeedback.length > 0 ? `Recent feedback given:\n${recentFeedback.map((f) => `- "${f}"`).join('\n')}` : 'No previous feedback recorded.'}

Please provide:
1. Patterns you notice (improving, declining, or consistent)
2. Areas where feedback could help the most
3. Whether previous feedback seems to be having an effect
4. A suggested focus area for today's feedback`,
  }
}

export function designerFeedbackPrompt(
  designerName: string,
  submissions: SubmissionData[]
): { system: string; user: string } {
  return {
    system: `You are a supportive design coach. You provide encouraging but honest feedback summaries to help designers improve. Use a warm, professional tone. Structure your response with clear sections. Keep it concise — about 200 words total.`,
    user: `Generate a feedback summary for ${designerName} based on their recent submission history.

Submissions (newest first):
${submissions
  .map(
    (s) =>
      `- ${s.date}: ${s.staticCount} statics, ${s.videoCount} videos | Productivity: ${s.productivity ?? 'unrated'}, Quality: ${s.quality ?? 'unrated'}${s.judgeComment ? ` | Judge feedback: "${s.judgeComment}"` : ''}`
  )
  .join('\n')}

Please provide:

**Strengths**: What they're doing well (be specific)

**Areas for Growth**: Where they can improve (be constructive)

**Score Trends**: How their scores have changed over time

**Recent Feedback Themes**: Key takeaways from judge comments

**Recommended Focus**: One specific thing to focus on next`,
  }
}

export function adminWeeklyPrompt(
  designerName: string,
  submissions: SubmissionData[]
): { system: string; user: string } {
  return {
    system: `You are an analytics assistant for design team leads. You create brief, data-driven weekly reviews of each designer's performance. Be factual and objective. Keep it under 150 words.`,
    user: `Generate a weekly review summary for ${designerName}.

Recent submissions:
${submissions
  .map(
    (s) =>
      `- ${s.date}: ${s.staticCount} statics, ${s.videoCount} videos | Productivity: ${s.productivity ?? 'unrated'}, Quality: ${s.quality ?? 'unrated'}${s.judgeComment ? ` | Feedback: "${s.judgeComment}"` : ''}`
  )
  .join('\n')}

Provide a brief summary covering:
- Output volume and consistency
- Score trajectory (improving/declining/stable)
- Key feedback themes
- Overall assessment (1-2 sentences)`,
  }
}
