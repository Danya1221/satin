import { redirect } from "next/navigation";

export default function CommunityRedirectPage() {
  redirect("/nz-console/products?section=questions");
}
