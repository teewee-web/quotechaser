import Link from "next/link";
import { ClipboardList, Plus, Sparkles } from "lucide-react";

export function Empty({ title, copy, href, label }: { title: string; copy: string; href?: string; label?: string }) {
  return <div className="card qc-card empty-state">
    <div className="empty-state-copy"><span className="empty-state-icon"><ClipboardList size={27} /></span><div><span className="empty-kicker"><Sparkles size={14} />Ready for what’s next</span><h2>{title}</h2><p>{copy}</p></div></div>
    {href && <Link className="btn btn-primary empty-action" href={href}><Plus size={18} />{label}</Link>}
  </div>;
}
