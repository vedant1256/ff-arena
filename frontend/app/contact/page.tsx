// frontend/app/contact/page.tsx
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto py-12 px-4 text-gray-300">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-wider uppercase border-b border-gray-800 pb-4">
        Contact Us
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            Have a question, facing an issue with a tournament, or need help with a payout? Our dedicated support team is here to help you get back into the game.
          </p>
          
          <p>
            Please allow up to 24 hours for our team to respond to your queries.
          </p>
        </div>

        <div className="bg-[#11141D] border border-gray-800 p-8 rounded-2xl space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="text-[#00F0FF] mt-1" size={24} />
            <div>
              <h3 className="text-white font-bold uppercase tracking-wider">Email Support</h3>
              <p className="text-gray-400 mt-1">support@vpsesportshub.com</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="text-[#00F0FF] mt-1" size={24} />
            <div>
              <h3 className="text-white font-bold uppercase tracking-wider">Phone</h3>
              <p className="text-gray-400 mt-1">+91 98765 43210</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="text-[#00F0FF] mt-1" size={24} />
            <div>
              <h3 className="text-white font-bold uppercase tracking-wider">Registered Office</h3>
              <p className="text-gray-400 mt-1">
                VPS EsportsHub HQ<br/>
                Pune, Maharashtra, 411001<br/>
                India
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}