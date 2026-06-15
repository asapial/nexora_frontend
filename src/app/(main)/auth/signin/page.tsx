import React from 'react';
import SignInPage from './SignInPage';
import type { SignInPageData } from './SignInPage';
import { getSiteContentSection } from '@/lib/site-content.server';

export const revalidate = 600;

export default async function page() {
  const section = await getSiteContentSection("auth-signin");
  return (
    <div><SignInPage data={section!.content as unknown as SignInPageData}></SignInPage></div>
  );
}
