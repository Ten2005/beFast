import { useDashboardStore } from "@/store/dashboard";
import { useSidebarStore } from "@/store/sidebar";
import PageButtons from "@/components/dashboard/pageButton";
import { readFilesAction } from "@/app/(main)/dashboard/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMAND_MODEL_OPTIONS } from "@/constants/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardHeader() {
  const { currentFolder, setCurrentFiles } = useSidebarStore();
  const { commandModel, setCommandModel } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFolder) {
      return;
    }

    const targetId = currentFolder.id;
    const formData = new FormData(e.target as HTMLFormElement);
    const queryValue = formData.get("query") as string;
    setOpen(false);
    try {
      // api/queryに送信
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: queryValue,
          folderId: targetId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      if (currentFolder.id === targetId) {
        readFilesAction(targetId);
        setCurrentFiles(await readFilesAction(targetId));
      }
    }
  };

  return (
    <div className="flex flex-col justify-center py-1 px-2 sticky h-10 top-10 z-5">
      <div className="flex flex-row items-center justify-end">
        <div className="flex flex-row items-center gap-2">
          <Select
            value={commandModel}
            onValueChange={(v) =>
              setCommandModel(v as (typeof COMMAND_MODEL_OPTIONS)[number])
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {COMMAND_MODEL_OPTIONS.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger>
              <InfoIcon className="size-4 text-primary" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Command Usage</DialogTitle>
                <DialogDescription asChild>
                  <CommandUsage />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        {currentFolder && (
          <div className="flex flex-row items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="icon">
                  <Search className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-full">
                <ScrollArea className="h-[100dvh] px-2 pb-4">
                  <SheetHeader>
                    <SheetTitle>Search</SheetTitle>
                    <SheetDescription>
                      Generate a response based on your input query, which will
                      be added to a new page.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <InputGroup className="sticky buttom-0 min-h-[calc(100dvh-100px)]">
                      <InputGroupTextarea
                        placeholder="Enter your query..."
                        name="query"
                        defaultValue=""
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupButton
                          className="ml-auto"
                          size="sm"
                          variant="default"
                          type="submit"
                        >
                          Search
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </form>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <PageButtons />
          </div>
        )}
      </div>
    </div>
  );
}

function CommandUsage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm">
          <span>&#47;&#47; Content enclosed with</span>
          <code className="bg-muted px-1 rounded">&quot;-&gt;&quot;</code> and
          <code className="bg-muted px-1 rounded">&quot;&lt;-&quot;</code> is
          recognized as a command. Use the following format to get a response:
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
          -&gt; query &lt;-
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm">
          The response will be generated by following format:
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
          -&gt;
          <br />
          query
          <br />
          --
          <br />
          response
          <br />
          &lt;-
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm">
          <span>&#47;&#47; Content enclosed with</span>
          <code className="bg-muted px-1 rounded">&quot;&gt;&gt;&quot;</code>
          and
          <code className="bg-muted px-1 rounded">&quot;&lt;&lt;&quot;</code>
          can be deleted. Use the following format to delete:
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
          &gt;&gt; content to delete &lt;&lt;
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm">
          <span>
            &#47;&#47; Choose the model you want to use for the command.
          </span>
        </p>
      </div>
    </div>
  );
}
