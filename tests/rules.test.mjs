import test from "node:test";
import { RuleTester } from "eslint";
import { fileURLToPath } from "node:url";
import { createPlugin } from "../src/create-plugin.mjs";

const suiteStack = [];

RuleTester.describe = (name, callback) => {
  suiteStack.push(name);
  callback();
  suiteStack.pop();
};

RuleTester.it = (name, callback) => {
  test([...suiteStack, name].join(" > "), callback);
};

RuleTester.itOnly = RuleTester.it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    sourceType: "module",
  },
});
const plugin = createPlugin();
const themeFixture = fileURLToPath(new URL("./fixtures/next/", import.meta.url));
const utilityOnlyFixture = fileURLToPath(
  new URL("./fixtures/utility-only/", import.meta.url),
);
const themeSettings = {
  tailwindcssCondense: {
    cwd: themeFixture,
  },
};
const utilityOnlySettings = {
  tailwindcssCondense: {
    cwd: utilityOnlyFixture,
  },
};
const customCalleeSettings = {
  tailwindcssCondense: {
    callees: ["bem"],
  },
};

ruleTester.run(
  "tailwindcss-condense/normalize-class-spacing",
  plugin.rules["normalize-class-spacing"],
  {
    invalid: [
      {
        code: 'const view = <div className=" pt-4 pb-4" />;',
        errors: [{ messageId: "normalizeClassSpacing" }],
        output: 'const view = <div className="pt-4 pb-4" />;',
      },
      {
        code: 'const view = <div className="pt-4 pb-4 " />;',
        errors: [{ messageId: "normalizeClassSpacing" }],
        output: 'const view = <div className="pt-4 pb-4" />;',
      },
      {
        code: 'const view = <div className="pt-4  pb-4" />;',
        errors: [{ messageId: "normalizeClassSpacing" }],
        output: 'const view = <div className="pt-4 pb-4" />;',
      },
      {
        code: 'const value = cn(" pt-4  pb-4 ");',
        errors: [{ messageId: "normalizeClassSpacing" }],
        output: 'const value = cn("pt-4 pb-4");',
      },
      {
        code: 'const value = tw` pt-4  pb-4 `;',
        errors: [{ messageId: "normalizeClassSpacing" }],
        output: 'const value = tw`pt-4 pb-4`;',
      },
    ],
    valid: [
      'const view = <div className="pt-4 pb-4" />;',
      'const value = cn("pt-4 pb-4");',
      'const value = <div className={`pt-${size} pb-4`} />;',
    ],
  },
);

ruleTester.run(
  "tailwindcss-condense/prefer-class-shorthand",
  plugin.rules["prefer-class-shorthand"],
  {
    invalid: [
      {
        code: 'const view = <div className="pt-4 pb-4" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="py-4" />;',
      },
      {
        code: 'const view = <div className="pt-4 custom-class pb-4" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="py-4 custom-class" />;',
      },
      {
        code: 'const view = <div className="-ml-2 custom-class -mr-2" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="-mx-2 custom-class" />;',
      },
      {
        code: 'const view = <div className="w-6 custom-size h-6" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="size-6 custom-size" />;',
      },
      {
        code: 'const view = <div className="sm:pt-4 custom-class sm:pb-4" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="sm:py-4 custom-class" />;',
      },
      {
        code: 'const view = <div className="gap-x-gutter custom-gap gap-y-gutter" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="gap-gutter custom-gap" />;',
        settings: themeSettings,
      },
      {
        code: 'const view = <div className="border-l-2 custom-border border-r-2" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-x-2 custom-border" />;',
      },
      {
        code: 'const view = <div className="border-t text-white border" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border text-white" />;',
      },
      {
        code: 'const view = <div className="border-b flex border-t" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-y flex" />;',
      },
      {
        code: 'const view = <div className="border-t border-b border" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border" />;',
      },
      {
        code: 'const view = <div className="border-t border-b relative border" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border relative" />;',
      },
      {
        code: 'const view = <div className="border-t border-b text-center border-y" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-y text-center" />;',
      },
      {
        code: 'const view = <div className="border-t border-y font-bold border-y" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-y font-bold" />;',
      },
      {
        code: 'const view = <div className="pt-4 text-white pb-4" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="py-4 text-white" />;',
      },
      {
        code: 'const view = <div className="w-6 bg-red-500 h-6 size-6" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="size-6 bg-red-500" />;',
      },
      {
        code: 'const view = <div className="rounded-tl-sm rounded-tr-sm flex rounded-t-sm" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="rounded-t-sm flex" />;',
      },
      {
        code: 'const view = <div className="px-4 py-4" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="p-4" />;',
      },
      {
        code: 'const view = <div className="w-6 h-6" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="size-6" />;',
      },
      {
        code: 'const view = <div className="border-l-2 border-r-2" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-x-2" />;',
      },
      {
        code: 'const view = <div className="pt-[1rem] pb-[1rem]" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="py-[1rem]" />;',
      },
      {
        code: 'const view = <div className="gap-x-gutter gap-y-gutter" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="gap-gutter" />;',
        settings: themeSettings,
      },
      {
        code: 'const view = <div className="-mt-2 -mb-2" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="-my-2" />;',
      },
      {
        code: 'const view = <div className="scroll-pt-8 scroll-pb-8" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="scroll-py-8" />;',
      },
      {
        code: 'const view = <div className="border-l-red-500 border-r-red-500" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="border-x-red-500" />;',
      },
      {
        code: 'const view = <div className="content-center justify-center" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="place-content-center" />;',
      },
      {
        code: 'const view = <div className="overflow-x-hidden overflow-y-hidden" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="overflow-hidden" />;',
      },
      {
        code: 'const view = <div className="translate-x-6 translate-y-6" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="translate-6" />;',
      },
      {
        code: 'const view = <div className="scale-x-50 scale-y-50 scale-z-50" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="scale-50" />;',
      },
      {
        code: 'const view = <div className="rounded-tl-sm rounded-tr-sm" />;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const view = <div className="rounded-t-sm" />;',
      },
      {
        code: 'const value = cn("pt-4 pb-4");',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = cn("py-4");',
      },
      {
        code: 'const value = cn("ml-2 custom-class mr-2");',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = cn("mx-2 custom-class");',
      },
      {
        code: 'const value = clsx({ "pt-4 pb-4": active });',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = clsx({ "py-4": active });',
      },
      {
        code: 'const value = cva("pt-4 pb-4", { variants: { intent: { primary: "px-4 py-4" } } });',
        errors: [
          { messageId: "preferClassShorthand" },
          { messageId: "preferClassShorthand" },
        ],
        output: 'const value = cva("py-4", { variants: { intent: { primary: "p-4" } } });',
      },
      {
        code: 'const value = tw`pt-4 pb-4`;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = tw`py-4`;',
      },
      {
        code: 'const value = tw`w-6 custom-size h-6`;',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = tw`size-6 custom-size`;',
      },
      {
        code: 'const value = bem("pt-4 pb-4");',
        errors: [{ messageId: "preferClassShorthand" }],
        output: 'const value = bem("py-4");',
        settings: customCalleeSettings,
      },
    ],
    valid: [
      {
        code: 'const view = <div className="gap-x-gutter gap-y-gutter" />;',
        settings: utilityOnlySettings,
      },
      'const view = <div className="border border" />;',
      'const view = <div className="p-4 p-4" />;',
      'const view = <div className="rounded rounded" />;',
      'const view = <div className="border bg-white border" />;',
      'const view = <div className="size-6 custom-size size-6" />;',
      'const view = <div className="gap-5 gap-x-2" />;',
      'const view = <div className={`pt-${size} pb-8`} />;',
      'const view = <div className="content-center justify-end" />;',
      'const view = <div className="overflow-x-hidden overflow-y-auto" />;',
      'const view = <div className="scale-x-50 scale-y-50" />;',
      'const value = bem("pt-4 pb-4");',
      'const value = cva("pt-4", { defaultVariants: { size: "px-4 py-4" } });',
    ],
  },
);

ruleTester.run(
  "tailwindcss-condense/group-related-classes",
  plugin.rules["group-related-classes"],
  {
    invalid: [
      {
        code: 'const view = <div className="bg-red-500 text-white hover:bg-red-600" />;',
        errors: [{ messageId: "groupRelatedClasses" }],
        output: 'const view = <div className="bg-red-500 hover:bg-red-600 text-white" />;',
      },
      {
        code: 'const view = <div className="bg-red-500 text-white unknown hover:bg-red-600" />;',
        errors: [{ messageId: "groupRelatedClasses" }],
        output: 'const view = <div className="bg-red-500 hover:bg-red-600 unknown text-white" />;',
      },
      {
        code: 'const view = <div className="flex-row flex sm:flex-col" />;',
        errors: [{ messageId: "groupRelatedClasses" }],
        output: 'const view = <div className="flex-row sm:flex-col flex" />;',
      },
      {
        code: 'const button = cva("rounded", { variants: { intent: { primary: "bg-red-500 text-white hover:bg-red-600" } } });',
        errors: [{ messageId: "groupRelatedClasses" }],
        output: 'const button = cva("rounded", { variants: { intent: { primary: "bg-red-500 hover:bg-red-600 text-white" } } });',
      },
      {
        code: 'const value = cn("bg-red-500 text-white hover:bg-red-600");',
        errors: [{ messageId: "groupRelatedClasses" }],
        output: 'const value = cn("bg-red-500 hover:bg-red-600 text-white");',
      },
    ],
    valid: [
      'const view = <div className="bg-sky-500 md:bg-black text-slate-900 sm:text-white" />;',
      'const view = <div className="flex flex-row sm:flex-col" />;',
      'const view = <div className="border bg-white border" />;',
      'const view = <div className="p-4 text-white p-4" />;',
      'const view = <div className="text-white bg-black text-white" />;',
      'const view = <div className="rounded flex rounded" />;',
      'const view = <div className="border-b flex border-t" />;',
      'const view = <div className="w-6 relative h-6" />;',
      'const view = <div className="border-t border-b relative border" />;',
      'const view = <div className="border-t border-b text-center border-y" />;',
      'const view = <div className="border-t border-y font-bold border-y" />;',
    ],
  },
);

ruleTester.run(
  "tailwindcss-condense/sort-class-variants",
  plugin.rules["sort-class-variants"],
  {
    invalid: [
      {
        code: 'const view = <div className="lg:p-8 sm:p-2 md:p-5" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="sm:p-2 md:p-5 lg:p-8" />;',
      },
      {
        code: 'const view = <div className="lg:p-8 custom-class sm:p-2 md:p-5" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="sm:p-2 custom-class md:p-5 lg:p-8" />;',
      },
      {
        code: 'const view = <div className="focus:bg-red-500 custom-class hover:bg-red-600" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="hover:bg-red-600 custom-class focus:bg-red-500" />;',
      },
      {
        code: 'const view = <div className="hover:sm:bg-red-500" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="sm:hover:bg-red-500" />;',
      },
      {
        code: 'const view = <div className="group-focus:bg-red-500 group-hover:bg-red-600" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="group-hover:bg-red-600 group-focus:bg-red-500" />;',
      },
      {
        code: 'const view = <div className="@lg:p-8 @md:p-3" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="@md:p-3 @lg:p-8" />;',
      },
      {
        code: 'const view = <div className="max-lg:p-8 max-sm:p-2 max-md:p-5" />;',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const view = <div className="max-sm:p-2 max-md:p-5 max-lg:p-8" />;',
      },
      {
        code: 'const value = cn("lg:p-8 sm:p-2 md:p-5");',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const value = cn("sm:p-2 md:p-5 lg:p-8");',
      },
      {
        code: 'const button = cva("rounded", { variants: { size: { md: "lg:p-8 sm:p-2 md:p-5" } } });',
        errors: [{ messageId: "sortClassVariants" }],
        output: 'const button = cva("rounded", { variants: { size: { md: "sm:p-2 md:p-5 lg:p-8" } } });',
      },
    ],
    valid: [
      'const view = <div className="bg-sky-500 md:bg-black text-slate-900 sm:text-white" />;',
      'const view = <div className="sm:hover:bg-red-500" />;',
      'const view = <div className="max-sm:p-2 max-md:p-5 max-lg:p-8" />;',
      'const view = <div className={`hover:${color}`} />;',
      'const view = <div className="md:p-4 sm:p-2 md:p-4" />;',
      'const view = <div className="md:text-white sm:text-black md:text-white" />;',
      'const view = <div className="md:border-t sm:border-y sm:border-t" />;',
    ],
  },
);
