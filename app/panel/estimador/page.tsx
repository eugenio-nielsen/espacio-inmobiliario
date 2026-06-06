import { redirect } from "next/navigation";

// La configuración del estimador ahora vive en el hub de superadmin.
export default function EstimadorAdminRedirect() {
  redirect("/panel/admin");
}
