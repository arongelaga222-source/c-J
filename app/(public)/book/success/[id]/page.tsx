import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookSuccessAliasPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const queryString = new URLSearchParams(
    resolvedSearchParams as Record<string, string>
  ).toString();

  redirect(`/booking/success/${id}${queryString ? `?${queryString}` : ''}`);
}
