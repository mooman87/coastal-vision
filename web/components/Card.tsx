import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

export type CardProps = {
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  className?: string;
  children?: React.ReactNode;
  imageUrl?: string;
};

export default function Card({ title, subtitle, href, className, children, imageUrl }: CardProps) {
  const content = (
    <article className={clsx('card overflow-hidden', className)}>
      {imageUrl && (
        <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-slate-600 text-sm">{subtitle}</p>}
        {children}
      </div>
    </article>
  );

  return href ? (<Link href={href} className="block">{content}</Link>) : content;
}