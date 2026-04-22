import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-semibold">Account</h3>
          <p className="text-muted-foreground text-sm">
            Make changes to your account here. Click save when you're done.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-semibold">Password</h3>
          <p className="text-muted-foreground text-sm">
            Change your password. After saving, you'll be logged out.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <p className="text-muted-foreground text-sm">
            Configure how you receive notifications.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports" disabled>
          Reports
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="rounded-md border p-4 text-sm">
          Overview panel content.
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="rounded-md border p-4 text-sm">
          Analytics panel content.
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="rounded-md border p-4 text-sm">
          Reports panel content.
        </div>
      </TabsContent>
    </Tabs>
  ),
};
