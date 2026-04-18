import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

export function SupportWidget() {
  return (
    <Card className="border-border bg-gradient-to-br from-accent/20 to-primary/10">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Need Help?</h3>
              <p className="text-xs text-muted-foreground mt-1">Contact support team</p>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Get Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
