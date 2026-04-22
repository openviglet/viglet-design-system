import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

const meta = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                    href="#"
                  >
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Viglet Design System
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Beautifully designed components built with Radix UI and
                      Tailwind CSS.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Introduction</div>
                    <p className="text-muted-foreground text-sm">
                      Re-usable components built with Radix UI.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Installation</div>
                    <p className="text-muted-foreground text-sm">
                      How to install dependencies and structure your app.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Typography</div>
                    <p className="text-muted-foreground text-sm">
                      Styles for headings, paragraphs, lists...etc.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Alert Dialog</div>
                    <p className="text-muted-foreground text-sm">
                      A modal dialog that interrupts the user.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Hover Card</div>
                    <p className="text-muted-foreground text-sm">
                      Preview content behind a link.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Progress</div>
                    <p className="text-muted-foreground text-sm">
                      Displays an indicator of a task's completion.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a href="#">
                    <div className="text-sm font-medium">Scroll-area</div>
                    <p className="text-muted-foreground text-sm">
                      Visually or semantically separates content.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium"
          >
            <a href="#">Documentation</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
