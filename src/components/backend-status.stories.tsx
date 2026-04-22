import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BackendStatusBanner,
  BackendStatusProvider,
  reportBackendOffline,
  reportBackendOnline,
} from "./backend-status";

const meta = {
  title: "App/BackendStatusBanner",
  component: BackendStatusBanner,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BackendStatusProvider healthEndpoint="/api/v2/ping" showBanner={false}>
        <div className="min-h-[120px]">
          <Story />
        </div>
      </BackendStatusProvider>
    ),
  ],
} satisfies Meta<typeof BackendStatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Banner hidden — backend is online. */
export const Online: Story = {
  render: () => {
    reportBackendOnline();
    return (
      <div>
        <BackendStatusBanner />
        <p className="p-4 text-sm text-muted-foreground">
          Backend is online — the banner renders nothing.
        </p>
      </div>
    );
  },
};

/** Banner visible — backend reported offline via the event bus. */
export const Offline: Story = {
  render: () => {
    reportBackendOffline();
    return (
      <div>
        <BackendStatusBanner />
        <p className="p-4 text-sm text-muted-foreground">
          Backend is offline — the provider polls the health endpoint.
        </p>
      </div>
    );
  },
};
