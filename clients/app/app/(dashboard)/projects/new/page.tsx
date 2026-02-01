'use client';

import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { CREATE_PROJECT } from '@/graphql/mutations/projects';
import { GET_PROJECTS } from '@/graphql/queries/projects';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft2, Flash, FolderCloud } from 'iconsax-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
  });

  const [createProject] = useMutation<{ createProject: { id: string } }>(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
  });

  const onSubmit = async (data: CreateProjectFormValues) => {
    try {
      const { data: projectData } = await createProject({
        variables: { title: data.title, description: data.description },
      });
      const projectId = projectData?.createProject?.id;
      if (!projectId) throw new Error('Failed to retrieve project ID');

      console.log('Project created successfully:', projectId);
      toast.success('Project created successfully!');
      router.push(`/projects/${projectId}/studio`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Something went wrong during creation. Please try again.');
    }
  };

  return (
    <div className="mx-auto w-full space-y-8 py-4">
      <Link
        href="/projects"
        className="flex w-fit items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft2 size={16} color="currentColor" />
        Back to Projects
      </Link>

      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Create New Project</h2>
        <p className="text-neutral-400">Describe your vision and start your creative journey.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
        <div className="space-y-6">
          <Input
            label="Project Title"
            type="text"
            placeholder="e.g. Summer Surf Trip 2026"
            startIcon={<FolderCloud color="currentColor" />}
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Description"
            type="textarea"
            rows={6}
            placeholder="e.g. A cinematic 'day in the life' vlog highlighting a balanced work-from-home routine, deep work sessions, and high-performance lifestyle perks."
            startIcon={<Flash color="currentColor" />}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div className="flex justify-start pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-3 rounded-full bg-white px-10 py-4 text-lg font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Creating Project...
              </>
            ) : (
              'Generate Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
