const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const nodemailer = require('nodemailer');
const session = require('express-session');
const { products, posts } = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;

const GA_ID = process.env.GA_MEASUREMENT_ID || '';
const FB_PIXEL_ID = process.env.FB_PIXEL_ID || '';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_TO   = process.env.MAIL_TO || 'marazzul773@gmail.com';
const MAIL_FROM = process.env.MAIL_FROM || `Clinica Mar Azul <${SMTP_USER || 'no-reply@localhost'}>`;
const SHEETS_WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'marazul-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000*60*60*6 }
}));

app.locals.site = {
  name: 'Clínica Mar Azul',
  addr: 'Vila de Viana, Rua dos Bombeiros, Luanda, Angola',
  phone: '+244 928 527 283',
  email: 'marazzul773@gmail.com',
  whatsapp: '244928527283',
  social: {
    instagram: 'https://www.instagram.com/marazzull1.0?igsh=ZTM3eDZ1bzk1Nzc5&utm_source=qr',
    facebook: 'https://www.facebook.com/share/1YUmv3XnzR/?mibextid=wwXIfr',
    tiktok: 'https://www.tiktok.com/@pequenopesquisado?_t=ZM-90KU0p5aTjE&_r=1'
  }
};
app.locals.analytics = { GA_ID, FB_PIXEL_ID };

function nowISO(){ return new Date().toISOString(); }
function ensure(fp){ if(!fs.existsSync(fp)) fs.writeFileSync(fp, '[]', 'utf8'); }
async function forwardToSheets(payload){
  if (!SHEETS_WEBHOOK_URL) return { ok:false };
  try{
    const r = await axios.post(SHEETS_WEBHOOK_URL, payload, { timeout: 10000 });
    return { ok:true, status:r.status };
  }catch(e){ return { ok:false, error:e.message }; }
}
function getTransporter(){
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT)===465,
    auth:{ user:SMTP_USER, pass:SMTP_PASS }
 });
}
app.get('/', (req,res)=> res.render('home', { products, posts }));

app.get('/produtos', (req,res)=> res.render('produtos', { products }));
app.get('/produtos/:slug', (req,res)=>{
  const p = products.find(x=>x.slug===req.params.slug);
  if(!p) return res.status(404).render('404');
  res.render('produto', { p });
});

app.get('/blog', (req,res)=> res.render('blog', { posts }));
app.get('/blog/:slug', (req,res)=>{
  const post = posts.find(x=>x.slug===req.params.slug);
  if(!post) return res.status(404).render('404');
  res.render('post', { post });
  // páginas institucionais
app.get('/quem-somos', (req,res)=> res.render('quem-somos'));
app.get('/tratamentos', (req,res)=> res.render('tratamentos'));
app.get('/exames', (req,res)=> res.render('exames'));

// atalhos
app.get('/marcacao', (req,res)=> res.redirect('/agendar'));
app.get('/contacto', (req,res)=> res.redirect('/contato'));

  const a = Math.floor(Math.random()*8)+2;
  const b = Math.floor(Math.random()*8)+1;
  req.session.captcha = { a, b, sum:a+b };
  res.render('contato', { error:null, captcha:req.session.captcha, site:app.locals.site });
});
app.post('/contato', async (req,res)=>{
  const { nome, email, telefone, assunto, mensagem, captcha:ans } = req.body || {};
  const ok = Number(ans)===(req.session.captcha?.sum||-1);
  const regen = ()=>{ const a=Math.floor(Math.random()*8)+2, b=Math.floor(Math.random()*8)+1; req.session.captcha={a,b,sum:a+b}; };
  if(!ok){ regen(); return res.status(400).render('contato', { error:'CAPTCHA inválido. Tente novamente.', captcha:req.session.captcha, site:app.locals.site }); }
  const item = { type:'contato', ts:nowISO(), nome, email, telefone, assunto, mensagem };
  const fp = path.join(__dirname,'leads.json'); ensure(fp);
  const arr = JSON.parse(fs.readFileSync(fp,'utf8')); arr.push(item);
  fs.writeFileSync(fp, JSON.stringify(arr,null,2));
  let mailOk=false, mailClientOk=false;
  try{
    const t = getTransporter();
    if(t){
      await t.sendMail({ from:MAIL_FROM, to:MAIL_TO, subject:`Contato — ${assunto||''}`,
        text:`Nome: ${nome}
E-mail: ${email}
Telefone: ${telefone}
Assunto: ${assunto}
Mensagem:
${mensagem}

Enviado: ${item.ts}` });
      mailOk=true;
      if(email){
        await t.sendMail({ from:MAIL_FROM, to:email, subject:'Recebemos a sua mensagem — Clínica Mar Azul',
          text:`Olá ${nome||''},

Recebemos a sua mensagem e logo entraremos em contacto.

Clínica Mar Azul
Contacto: ${app.locals.site.phone}` });
        mailClientOk=true;
      }
    }
  }catch(e){}
  const sheets = await forwardToSheets(item);
  regen();
  res.render('contato-ok', { mailOk, mailClientOk, sheets });
});

app.get('/agendar', (req,res)=>res.redirect('/marcacao'));
  const a = Math.floor(Math.random()*8)+2;
  const b = Math.floor(Math.random()*8)+1;
  req.session.captcha = { a, b, sum:a+b };
  res.render('agendar', { error:null, captcha:req.session.captcha, site:app.locals.site });
});
app.post('/agendar', async (req,res)=>{
  const { nome, telefone, email, data, hora, modalidade, observacoes, captcha:ans } = req.body || {};
  const ok = Number(ans)===(req.session.captcha?.sum||-1);
  const regen = ()=>{ const a=Math.floor(Math.random()*8)+2, b=Math.floor(Math.random()*8)+1; req.session.captcha={a,b,sum:a+b}; };
  if(!ok){ regen(); return res.status(400).render('agendar', { error:'CAPTCHA inválido. Tente novamente.', captcha:req.session.captcha, site:app.locals.site }); }
  const item = { type:'agendamento', ts:nowISO(), nome, telefone, email, data, hora, modalidade, observacoes };
  const fp = path.join(__dirname,'agendamentos.json'); ensure(fp);
  const arr = JSON.parse(fs.readFileSync(fp,'utf8')); arr.push(item);
  fs.writeFileSync(fp, JSON.stringify(arr,null,2));
  let mailOk=false, mailClientOk=false;
  try{
    const t = getTransporter();
    if(t){
      await t.sendMail({ from:MAIL_FROM, to:MAIL_TO, subject:`Novo agendamento — ${nome||''}`,
        text:`Nome: ${nome}
Telefone: ${telefone}
Email: ${email||''}
Data: ${data}
Hora: ${hora}
Modalidade: ${modalidade}
Obs: ${observacoes||''}

Enviado: ${item.ts}` });
      mailOk=true;
      if(email){
        await t.sendMail({ from:MAIL_FROM, to:email, subject:'Pedido de agendamento recebido — Clínica Mar Azul',
          text:`Olá ${nome||''},
Recebemos o seu pedido para ${data} às ${hora} (${modalidade}). Em breve confirmamos a disponibilidade.

Clínica Mar Azul` });
        mailClientOk=true;
      }
    }
  }catch(e){}
  const sheets = await forwardToSheets(item);
  const texto = encodeURIComponent(`Olá Clínica Mar Azul! Quero confirmar um agendamento.%0A%0ANome: ${nome}%0ATelefone: ${telefone}%0AEmail: ${email||''}%0AData: ${data}%0AHora: ${hora}%0AModalidade: ${modalidade}%0AObservações: ${observacoes||''}`);
  const wa = `https://wa.me/${app.locals.site.whatsapp}?text=${texto}`;
  regen();
  res.render('agendar-ok', { mailOk, mailClientOk, sheets, wa });
});

function requireAuth(req,res,next){ if(req.session && req.session.admin) return next(); return res.redirect('/admin/login'); }
app.get('/admin/login', (req,res)=> res.render('admin-login', { error:null }));
app.post('/admin/login', (req,res)=>{
  const { pass } = req.body || {};
  if (ADMIN_PASS && pass===ADMIN_PASS){ req.session.admin=true; return res.redirect('/admin'); }
  res.render('admin-login', { error:'Senha inválida.' });
});
app.post('/admin/logout', (req,res)=>{ req.session.admin=false; req.session.destroy(()=> res.redirect('/admin/login')); });
app.get('/admin', requireAuth, (req,res)=>{
  const leadsPath = path.join(__dirname,'leads.json');
  const agPath = path.join(__dirname,'agendamentos.json');
  const leads = fs.existsSync(leadsPath)? JSON.parse(fs.readFileSync(leadsPath,'utf8')):[];
  const ags = fs.existsSync(agPath)? JSON.parse(fs.readFileSync(agPath,'utf8')):[];
  res.render('admin', { leads, ags });
});
app.get('/admin/export/agendamentos.csv', requireAuth, (req,res)=>{
  const agPath = path.join(__dirname,'agendamentos.json');
  const ags = fs.existsSync(agPath)? JSON.parse(fs.readFileSync(agPath,'utf8')):[];
  const headers = ['ts','nome','telefone','email','data','hora','modalidade','observacoes'];
  const rows = [headers.join(',')].concat(ags.map(a => headers.map(h => {
    const v = (a[h] ?? '').toString().replace(/"/g,'""');
  const needsQuotes = v.includes(',') || v.includes('"') || v.includes('\n');
    return needsQuotes ? `"${v}"` : v;
  }).join(',')));
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="agendamentos.csv"');
  res.send(rows.join('\n'));
});

app.use((req,res)=> res.status(404).render('404'));

app.listen(PORT, ()=> console.log(`Mar Azul app on http://localhost:${PORT}`));
