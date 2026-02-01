'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CREATE_PROJECT } from '@/graphql/mutations/projects';
import { GET_PROJECTS } from '@/graphql/queries/projects';
import { useStudioStore } from '@/stores/studio';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { MagicStar } from 'iconsax-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z
    .string()
    .min(10, 'Vision must be at least 10 characters')
    .max(1000, 'Vision is too long'),
});

type CreateProjectValues = z.infer<typeof createProjectSchema>;

export function CreateProject({ onClose }: { onClose: () => void }) {
  const setActiveProjectId = useStudioStore((state) => state.setActiveProjectId);
  const projects = useStudioStore((state) => state.projects);
  const isFirstProject = projects.length === 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    mode: 'onChange',
  });

  const [createProject, { loading: isCreating }] = useMutation<{ createProject: { id: string } }>(
    CREATE_PROJECT,
    {
      refetchQueries: [{ query: GET_PROJECTS }],
    },
  );

  const onSubmit = async (values: CreateProjectValues) => {
    try {
      const { data } = await createProject({
        variables: {
          title: values.title,
          description: values.description,
        },
      });
      if (data?.createProject?.id) {
        setActiveProjectId(data.createProject.id);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="xl"
      className="bg-neutral-900/80! border-white/10 rounded-[32px] overflow-hidden"
    >
      <div className="relative p-10 space-y-8">
        {/* Decorative corner glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />

        <div className="space-y-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mb-2 shadow-xl">
              <MagicStar size={32} variant="Bulk" color="currentColor" />
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-white">
              {isFirstProject ? 'Create Your First Story' : 'Create New Story'}
            </h2>
            <p className="text-neutral-400 text-sm max-w-xs">
              {isFirstProject
                ? "Describe your vision and let skeet's AI director build your first timeline."
                : 'Describe your vision for this new story and let the AI director handle the rest.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Project Title"
              placeholder="e.g. My Cinematic Vlog"
              error={errors.title?.message}
              {...register('title')}
              className="bg-black/50 border-white/5 focus:border-white/20"
            />

            <Input
              label="Creative Intent (The 'Vibe')"
              type="textarea"
              rows={4}
              placeholder="e.g. A fast-paced edit of my surf trip with rhythmic cuts and a dreamy film look."
              error={errors.description?.message}
              {...register('description')}
              className="bg-black/50 border-white/5 focus:border-white/20"
            />

            <Button
              type="submit"
              disabled={!isValid}
              isLoading={isCreating}
              className="w-full rounded-full"
            >
              <span>{isFirstProject ? 'Initialize Project' : 'Create Project'}</span>
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
