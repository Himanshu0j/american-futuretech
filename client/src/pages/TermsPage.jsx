import React from 'react';
import { FileText } from 'lucide-react';
import LegalPolicyView from '../components/LegalPolicyView';

/**
 * Terms & Conditions — text and headings are edited in
 * Admin → Settings → Legal & Policies → Terms & Conditions.
 */
export default function TermsPage() {
  return <LegalPolicyView policyKey="terms" label="Terms & Conditions" Icon={FileText} />;
}
