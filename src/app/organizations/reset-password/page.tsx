import { Suspense } from 'react';
import OrganizationResetPasswordClient from './reset-password-client';


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationResetPasswordClient />
    </Suspense>
  );
}