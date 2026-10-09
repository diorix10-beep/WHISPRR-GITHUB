import { LegalDocumentView } from '../components/legal/LegalDocumentView';
import { TERMS } from '../legal/terms';

export default function TermsPage() {
  return <LegalDocumentView doc={TERMS} other={{ to: '/privacy', label: 'Privacy Policy' }} />;
}
