(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[626],{2635:function(e,t,r){Promise.resolve().then(r.bind(r,5207))},2959:function(e,t,r){"use strict";var s=r(1398);t.Z={postLogin:e=>s.W.post("login",e),getSelfInfo:()=>s.W.get("users/self-info"),getServiceTypes:e=>{let{page:t,size:r}=e;return s.W.get("service-types?page=".concat(t,"&size=").concat(r))},getBookingTimes:e=>{let{page:t,size:r}=e;return s.W.get("reservation-times?page=".concat(t,"&size=").concat(r))},createBookingTime:e=>{let{time:t,reservation_count:r}=e;return s.W.post("reservation-times",{time:t,reservation_count:r})},updateBookingTime:e=>{let{id:t,time:r,reservation_count:o}=e;return s.W.put("reservation-times/".concat(t),{time:r,reservation_count:o})},deleteBookingTime:e=>s.W.delete("reservation-times/".concat(e)),deleteUser:e=>s.W.delete("users/".concat(e)),createUser:e=>s.W.post("users",e),updateUser:e=>{let{name:t,surname:r,email:o,roleId:n,password:a,password_repeat:c,id:i}=e;return s.W.put("users/".concat(i),{name:t,surname:r,email:o,role_id:n,password:a,password_repeat:c})},updateServiceType:e=>{let{id:t,name:r,price:o}=e;return s.W.put("service-types/".concat(t),{name:r,price:o})},createServiceType:e=>{let{name:t,price:r}=e;return s.W.post("service-types",{name:t,price:r})},deleteServiceType:e=>s.W.delete("service-types/".concat(e)),getUsers:e=>{let{page:t,size:r}=e;return s.W.get("users?page=".concat(t,"&size=").concat(r))},getBookings:e=>{let{page:t,size:r,status:o,from_date:n,to_date:a,client_name:c,client_phone:i,service_types:l,doctor_id:d}=e;return s.W.get("reservations?&sort=asc&sorted_column=date_time",{params:{status:o,from_date:n,to_date:a,client_name:c,client_phone:i,service_types:l,doctor_id:d}})},getServices:e=>{let{page:t,size:r,status:o,from_date:n,to_date:a,client_name:c,client_phone:i,service_types:l,user_id:d}=e;return s.W.get("services?page=".concat(t,"&size=").concat(r,"&sort=desc"),{params:{status:o,from_date:n,to_date:a,client_name:c,client_phone:i,service_types:l,user_id:d}})},deleteService:e=>s.W.delete("services/".concat(e)),deleteBooking:e=>s.W.delete("reservations/".concat(e)),getBookingDoctors:e=>s.W.get("reservations/users/input-search?date_time=".concat(e)),getTotalAmount:e=>{let{status:t,from_date:r,to_date:o,client_name:n,client_phone:a,service_types:c,user_id:i}=e;return s.W.get("services/total-amounts",{params:{status:t,from_date:r,to_date:o,client_name:n,client_phone:a,service_types:c,user_id:i}})},getDoctors:()=>s.W.get("users/input-search"),getHours:e=>s.W.get("reservation-times/input-search?date=".concat(e)),getInputServices:()=>s.W.get("service-types/input-search"),createService:e=>s.W.post("services",e),createBooking:e=>s.W.post("reservations",e),updateService:e=>s.W.put("services/".concat(e.id),e),updateBooking:e=>s.W.put("reservations/".concat(e.id),e),getDailyReportExcel:async e=>{try{await s.W.get("services/daily-report?excel_export=true&sorted_day=".concat(e),{responseType:"blob"}).then(t=>{{let r=new Blob([t],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),s=window.URL.createObjectURL(r),o=document.createElement("a");o.href=s,o.setAttribute("download","daily_report_".concat(e,".xlsx")),document.body.appendChild(o),o.click(),document.body.removeChild(o)}})}catch(e){console.error("Error downloading the file",e)}},getAllReportsExcel:async e=>{let{status:t,from_date:r,to_date:o,client_name:n,client_phone:a,service_types:c,user_id:i}=e;try{await s.W.get("services/all-reports?excel_export=true&sort=desc",{responseType:"blob",params:{status:t,from_date:r,to_date:o,client_name:n,client_phone:a,service_types:c,user_id:i}}).then(e=>{let t=new Blob([e],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),s=window.URL.createObjectURL(t),n=document.createElement("a");n.href=s,n.setAttribute("download","general_report_".concat(r,"/").concat(o,".xlsx")),document.body.appendChild(n),n.click(),document.body.removeChild(n)})}catch(e){console.error("Error downloading the file",e)}},getBonuses:e=>{let{from_date:t,to_date:r,user_id:o}=e;return s.W.get("services/bonus-reports",{params:{from_date:t,to_date:r,user_id:o}})},getBonusesExcel:async e=>{let{from_date:t,to_date:r,user_id:o}=e;try{await s.W.get("services/bonus-reports?excel_export=true",{responseType:"blob",params:{from_date:t,to_date:r,user_id:o}}).then(e=>{let s=new Blob([e],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),o=window.URL.createObjectURL(s),n=document.createElement("a");n.href=o,n.setAttribute("download","bonus_report_".concat(t,"/").concat(r,".xlsx")),document.body.appendChild(n),n.click(),document.body.removeChild(n)})}catch(e){console.error("Error downloading the file",e)}}}},5207:function(e,t,r){"use strict";r.r(t);var s=r(7437),o=r(8861),n=r(6498),a=r(8708),c=r(5313),i=r(2265),l=r(9343),d=r(6463),u=r(6754),p=r.n(u),m=r(2959);t.default=function(){let[e,t]=(0,i.useState)(""),{control:r,handleSubmit:u,formState:{errors:g}}=(0,l.cI)(),v=(0,d.useRouter)(),h=async e=>{t("");try{let{data:t}=await m.Z.postLogin(e);localStorage.setItem("token",t.token.access_token),v.push("/")}catch(e){var r,s;console.error(e),t(null==e?void 0:null===(s=e.response)||void 0===s?void 0:null===(r=s.data)||void 0===r?void 0:r.message)}};return(0,i.useEffect)(()=>{localStorage.getItem("token")&&v.push("/")},[]),(0,s.jsxs)("main",{className:p().main,children:[(0,s.jsxs)("form",{className:p().inputs,onSubmit:u(h),children:[(0,s.jsxs)("div",{className:p().input,children:[(0,s.jsx)("label",{htmlFor:"email",children:"Email"}),(0,s.jsx)(l.Qr,{name:"email",control:r,rules:{required:!0},render:e=>{let{field:t}=e;return(0,s.jsx)(o.o,{invalid:!!g.email,"aria-describedby":"email-help",...t})}})]}),(0,s.jsxs)("div",{className:p().input,children:[(0,s.jsx)("label",{htmlFor:"password",children:"Şifrə"}),(0,s.jsx)(l.Qr,{name:"password",control:r,rules:{required:!0},render:e=>{let{field:t}=e;return(0,s.jsx)(n.r,{toggleMask:!0,feedback:!1,invalid:!!g.password,...t})}})]}),(0,s.jsx)(a.z,{label:"Login",type:"submit"})]}),g.password&&g.email&&(0,s.jsx)(c.v,{severity:"error",text:"Email və şifrə tələb olunur"}),e&&(0,s.jsx)(c.v,{severity:"error",text:e})]})}},1398:function(e,t,r){"use strict";r.d(t,{W:function(){return i},x:function(){return a}});var s=r(2126),o=r(6463);let n=null,a=e=>{n=e},c=s.Z.create({baseURL:"https://api.nargizestetik.az/api"});c.interceptors.request.use(e=>{let t=localStorage.getItem("token");return t&&(e.headers=e.headers||{},e.headers.Authorization="Bearer ".concat(t)),e}),c.interceptors.response.use(e=>null==e?void 0:e.data,async e=>{var t,r,s;return(e.response&&(null===(t=e.response)||void 0===t?void 0:t.data.message)==="USER_NOT_AUTHORIZED"?(localStorage.clear(),(0,o.redirect)("/login")):(e.response&&(null===(r=e.response)||void 0===r?void 0:r.data.message)||e.message)&&n&&n.show({severity:"error",summary:"Error",detail:(null===(s=e.response)||void 0===s?void 0:s.data.message)||e.message,life:3e3}),e&&e.response)?Promise.reject(e):Promise.reject()});let i=c},6754:function(e){e.exports={main:"page_main__qq1vh",inputs:"page_inputs__Ez60K",input:"page_input__pky70"}}},function(e){e.O(0,[161,567,971,23,744],function(){return e(e.s=2635)}),_N_E=e.O()}]);