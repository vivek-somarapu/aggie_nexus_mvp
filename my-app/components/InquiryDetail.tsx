import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface InquiryDetailProps {
  inquirer: {
    id: string;
    name: string;
    email: string;
    bio: string;
    avatarUrl?: string;
  };
  preferredContact: string;
  message: string;
}

export default function InquiryDetail({ inquirer, preferredContact, message }: InquiryDetailProps) {
  const truncateBio = (bio: string, maxLength: number = 80) => {
    if (!bio) return '';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength).trim() + '...';
  };

  // Check if message is longer than 50 words
  const wordCount = message.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isLongMessage = wordCount > 50;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/users/${inquirer.id}`} onClick={() => {
          if (typeof window !== 'undefined') {
            // Close the dialog by updating the parent state
            const event = new CustomEvent('closeInquiryDialog');
            window.dispatchEvent(event);
          }
        }}>
          <span className="flex items-center gap-2 cursor-pointer hover:underline">
            <Avatar className="h-12 w-12">
              <AvatarImage src={inquirer.avatarUrl} alt={inquirer.name} />
              <AvatarFallback>{inquirer.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-lg">{inquirer.name}</span>
          </span>
        </Link>
      </div>
      
      <div className="text-sm text-gray-600 truncate overflow-hidden whitespace-nowrap">{truncateBio(inquirer.bio)}</div>
      
      <div className="space-y-3">
        <div>
          <span className="font-bold">Preferred Contact:</span>
          <div className="mt-1 text-sm">
            {preferredContact}
          </div>
        </div>
        <div>
          <span className="font-bold">Message:</span>
          <div className={isLongMessage ? "mt-2 max-h-40 overflow-y-auto pr-2 text-sm whitespace-pre-wrap border rounded-md p-3 bg-gray-50" : "mt-1 text-sm whitespace-pre-wrap"}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
