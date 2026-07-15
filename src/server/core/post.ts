import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  if (!context.subredditName) throw new Error('subredditName is required');
  return reddit.submitCustomPost({
    subredditName: context.subredditName,
    title: 'Drift Council — One gust each. One voyage together.',
    entry: 'default',
  });
};
