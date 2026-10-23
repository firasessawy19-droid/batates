let edition = 'java';
const $ = id => document.getElementById(id);
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => {
  edition = button.dataset.edition;
  document.querySelectorAll('.choice').forEach(b => b.classList.toggle('selected', b === button));
}));
function headers(){ return {'Content-Type':'application/json','x-admin-token':$('token').value}; }
$('connect').addEventListener('click', async () => {
  $('notice').textContent = 'جارٍ إرسال طلب الاتصال...';
  try {
    const r = await fetch('/api/connect',{method:'POST',headers:headers(),body:JSON.stringify({edition})});
    const data = await r.json();
    $('notice').textContent = data.message || data.error || 'تم إرسال الطلب';
    await refresh();
  } catch { $('notice').textContent = 'تعذر الوصول إلى الخادم.'; }
});
$('disconnect').addEventListener('click', async () => {
  try {
    const r = await fetch('/api/disconnect',{method:'POST',headers:headers()});
    const data = await r.json(); $('notice').textContent = data.message || data.error || 'تم إرسال طلب الفصل'; await refresh();
  } catch { $('notice').textContent = 'تعذر الوصول إلى الخادم.'; }
});
async function refresh(){
  try{
    const r=await fetch('/api/status'); const d=await r.json();
    $('message').textContent=d.message;
    const pill=$('pill'); pill.textContent=({online:'متصل',connecting:'جارٍ الاتصال',error:'خطأ',offline:'غير متصل'})[d.state]||d.state;
    pill.className='status '+(d.state==='online'?'online':d.state==='error'?'error':'offline');
    $('logs').textContent=d.logs?.length?d.logs.slice().reverse().join('\\n'):'لا توجد أحداث بعد.';
  }catch{}
}
refresh(); setInterval(refresh,4000);
