import React from 'react';
import { Cookie } from 'lucide-react';
import LegalPolicyView from '../components/LegalPolicyView';

/**
 * Cookie Policy — text and pointers are edited in
 * Admin → Settings → Legal & Policies → Cookie Policy.
 */
export default function CookiePolicyPage() {
  return <LegalPolicyView policyKey="cookies" label="Cookie Policy" Icon={Cookie} />;
}
