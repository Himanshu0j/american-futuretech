import React from 'react';
import { Shield } from 'lucide-react';
import LegalPolicyView from '../components/LegalPolicyView';

/**
 * Privacy Policy — text and headings are edited in
 * Admin → Settings → Legal & Policies → Privacy Policy.
 */
export default function PrivacyPolicyPage() {
  return <LegalPolicyView policyKey="privacy" label="Privacy Policy" Icon={Shield} />;
}
