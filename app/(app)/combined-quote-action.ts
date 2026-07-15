"use server";
import {saveQuote} from "@/app/(app)/actions";
import {createClient} from "@/lib/supabase/server";
import {customerSchema} from "@/lib/validation";

export async function saveCustomerAndQuote(form:FormData){
 if(form.get("customer_mode")==="new"&&!form.get("id")){
  const parsed=customerSchema.safeParse({name:form.get("new_customer_name"),mobile:form.get("new_customer_mobile"),email:form.get("new_customer_email"),address:form.get("new_customer_address"),notes:""});
  if(!parsed.success)throw new Error(parsed.error.issues[0].message);
  const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)throw new Error("Please log in again.");const c=parsed.data;
  const{data,error}=await s.from("customers").insert({name:c.name,mobile:c.mobile||null,email:c.email||null,address:c.address||null,notes:null,user_id:user.id}).select("id").single();
  if(error||!data)throw new Error(error?.message||"The customer could not be created.");form.set("customer_id",data.id);
 }
 return saveQuote(form);
}
