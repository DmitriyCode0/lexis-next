'use client';

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PremiumBadge() {
  return (
    <Badge variant="secondary" className="gap-1 text-xs text-muted-foreground">
      <Lock className="h-3 w-3" />
      Premium
    </Badge>
  );
}
