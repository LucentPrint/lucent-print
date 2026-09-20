type EmailInput={to:string;subject:string;html:string};
export async function sendEmail(input:EmailInput){
 const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;
 if(!key||!from)return {ok:false,skipped:true};
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[input.to],subject:input.subject,html:input.html})});
 return {ok:r.ok,data:await r.json().catch(()=>null)};
}
