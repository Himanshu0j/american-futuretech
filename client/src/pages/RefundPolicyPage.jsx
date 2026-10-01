import React from 'react';
import { RefreshCw } from 'lucide-react';
import LegalPolicyView from '../components/LegalPolicyView';

/**
 * Refund & Return Policy — text and pointers are edited in
 * Admin → Settings → Legal & Policies → Refund & Return Policy.
 */
export default function RefundPolicyPage() {
  return <LegalPolicyView policyKey="refund" label="Refund & Return Policy" Icon={RefreshCw} />;
}
