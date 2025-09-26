import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Chat from "@/components/ui/tabs/chat";
import Documents from "@/components/ui/tabs/documents";
import Profile from "@/components/ui/tabs/profile";

export default function Home() {
    return (
        <div className="h-screen w-full flex flex-col">
            <Tabs
                defaultValue="chat"
                className="flex flex-col items-center h-full w-full"
            >
                <TabsList className="w-2/5 flex items-center justify-center gap-4 border-b bg-neutral-200">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
                <div className="flex-1 w-full flex">
                    <TabsContent value="chat" className="w-full h-full">
                        <Chat />
                    </TabsContent>
                    <TabsContent value="documents" className="w-full h-full">
                        <Documents />
                    </TabsContent>
                    <TabsContent value="profile" className="w-full h-full">
                        <Profile />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
