import React from 'react';
import SignUpPage from './SignUpPage';
import type { SignUpPageData } from './SignUpPage';
import { getSiteContentSection } from '@/lib/site-content.server';

export const revalidate = 600;

export default async function page() {
  const section = await getSiteContentSection("auth-signup");
  return (
    <div><SignUpPage data={section!.content as unknown as SignUpPageData}></SignUpPage></div>
  );
}
