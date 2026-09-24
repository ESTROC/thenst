import React from "react"
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
  href?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, className, iconClassName, href, onClick }: StatCardProps) {
  const content = (
    <CardContent className="flex items-center gap-4 p-6">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10",
          iconClassName
        )}
      >
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card className={cn(
          "transition-all duration-300 hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1 bg-card/50 backdrop-blur-sm",
          className
        )}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card 
      onClick={onClick} 
      className={cn(
        "transition-all duration-300", 
        onClick && "cursor-pointer hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
        className
      )}
    >
      {content}
    </Card>
  );
}
