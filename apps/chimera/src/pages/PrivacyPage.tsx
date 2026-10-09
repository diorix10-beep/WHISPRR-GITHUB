import { LegalDocumentView } from '../components/legal/LegalDocumentView';
import { PRIVACY } from '../legal/privacy';

export default function PrivacyPage() {
  return <LegalDocumentView doc={PRIVACY} other={{ to: '/terms', label: 'Terms of Service' }} />;
}
