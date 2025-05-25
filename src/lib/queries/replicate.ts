import Replicate from 'replicate';

export async function generateStyledImage(imageUrl: string, prompt: string): Promise<string> {
  const replicate = new Replicate();

  console.log('Running the model...');
  const output = (await replicate.run('black-forest-labs/flux-schnell', {
    input: {
      image: imageUrl,
      prompt: prompt,
    },
  })) as string[];

  return output[0];
}
