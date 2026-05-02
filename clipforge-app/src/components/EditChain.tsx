import { GitMerge, Heart, User } from "lucide-react";
import { EditNode } from "@/lib/mockData";
import Link from "next/link";

export default function EditChain({ edits }: { edits: EditNode[] }) {
  if (!edits || edits.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <GitMerge className="w-12 h-12 mx-auto text-white/20 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No edits yet</h3>
        <p className="text-white/60 mb-6">Be the first to create an AI variation of this video.</p>
        <Link href={`/edit/${edits?.[0]?.id || 'new'}`} className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors">
          Create Edit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-primary" />
          Edit Chain
        </h3>
        <Link href={`/edit/${edits[0].id}`} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors">
          Remix Latest
        </Link>
      </div>
      
      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
        {edits.map((edit, idx) => (
          <div key={edit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary bg-background absolute left-0 md:left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(138,43,226,0.5)]">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 glass-card group-hover:border-primary/50 transition-colors ml-6 md:ml-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <User className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{edit.creator}</div>
                  <div className="text-xs text-white/40">{edit.timestamp}</div>
                </div>
              </div>
              
              <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                <img src={edit.thumbnail} alt={edit.prompt} className="w-full h-full object-cover" />
              </div>
              
              <div className="text-sm text-white/80 mb-3 bg-white/5 p-2 rounded border border-white/5">
                <span className="text-primary font-mono text-xs block mb-1">PROMPT</span>
                "{edit.prompt}"
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <button className="flex items-center gap-1 text-xs text-white/60 hover:text-pink-500 transition-colors">
                  <Heart className="w-4 h-4" /> {edit.likes}
                </button>
                <Link href={`/video/${edit.id}`} className="text-xs text-primary hover:text-primary/80 transition-colors">
                  View full video
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
