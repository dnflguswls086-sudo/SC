const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const QRCode = require('qrcode');
const PORT = Number(process.env.PORT || 8080);
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DATA_FILE = path.join(DATA_DIR, 'game-data.json');

const ROOM_DEFS = {"nancho": {"name": "난초반", "players": ["강승효", "김동윤", "김주원", "양지완", "이서준", "이영현", "이이안", "이지환", "이호진", "정민준", "정윤후", "하이준", "고서진", "김리재", "박나윤", "박서은", "송윤하", "이가빈", "임엘린", "정단우", "정이현", "조서윤", "최인아", "김나현"]}, "jangmi": {"name": "장미반", "players": ["김도윤", "김효찬", "박대윤", "박준성", "이석현", "조성후", "조시윤", "조현호", "천세준", "최지환", "황현성", "고아림", "김로아", "김서윤", "아일라", "박윤진", "박지유", "박지율", "엄태희", "유수아", "이서하", "전아인", "함정원"]}, "moran": {"name": "모란반", "players": ["김동준", "김민제", "민두영", "박주환", "유정우", "이민우", "이승원", "이재준", "이준서", "장시우", "최승우", "최필림", "이건", "고다현", "구예린", "권지안", "김태윤", "박시영", "송하임", "이송현", "이주윤", "천은주", "최서윤", "하슬란"]}, "maehwa": {"name": "매화반", "players": ["강민석", "곽리안", "김민찬", "김서진", "김아윤", "류이안", "윤건우", "이세온", "이용제", "이은우", "이하루", "정유현", "김다솜", "김반디", "김선주", "김윤아", "김지효", "배지안", "임예린", "전서율", "차윤솔", "최보나", "현채윤", "홍채인"]}};
const BASE_ROUNDS = [{"missing": "S", "parts": {"S": "", "O": "아이스크림을", "P": "먹었다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "누가 아이스크림을 먹었을까?"}, {"missing": "O", "parts": {"S": "강아지가", "O": "", "P": "쫓아갔다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "강아지는 무엇을 쫓아갔을까?"}, {"missing": "P", "parts": {"S": "친구가", "O": "편지를", "P": "", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "친구는 편지를 어떻게 했을까?"}, {"missing": "L", "parts": {"S": "아이들이", "O": "", "P": "달려갔다", "L": "", "T": ""}, "order": ["S", "L", "P"], "hint": "아이들은 어디에 달려갔을까?"}, {"missing": "T", "parts": {"S": "민수가", "O": "편지를", "P": "보냈다", "L": "", "T": ""}, "order": ["S", "T", "O", "P"], "hint": "민수는 누구에게 편지를 보냈을까?"}, {"missing": "S", "parts": {"S": "", "O": "우산을", "P": "펼쳤다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "누가 우산을 펼쳤을까?"}, {"missing": "O", "parts": {"S": "선생님이", "O": "", "P": "칭찬했다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "선생님은 무엇 또는 누구를 칭찬했을까?"}, {"missing": "P", "parts": {"S": "토끼가", "O": "당근을", "P": "", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "토끼는 당근을 어떻게 했을까?"}, {"missing": "L", "parts": {"S": "가족이", "O": "", "P": "여행을 갔다", "L": "", "T": ""}, "order": ["S", "L", "P"], "hint": "가족은 어디에 여행을 갔을까?"}, {"missing": "T", "parts": {"S": "선생님이", "O": "상장을", "P": "주었다", "L": "", "T": ""}, "order": ["S", "T", "O", "P"], "hint": "선생님은 누구에게 상장을 주었을까?"}, {"missing": "S", "parts": {"S": "", "O": "공을", "P": "던졌다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "누가 공을 던졌을까?"}, {"missing": "O", "parts": {"S": "엄마가", "O": "", "P": "샀다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "엄마는 무엇을 샀을까?"}, {"missing": "P", "parts": {"S": "학생이", "O": "책을", "P": "", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "학생은 책을 어떻게 했을까?"}, {"missing": "L", "parts": {"S": "고양이가", "O": "", "P": "숨었다", "L": "", "T": ""}, "order": ["S", "L", "P"], "hint": "고양이는 어디에 숨었을까?"}, {"missing": "T", "parts": {"S": "동생이", "O": "선물을", "P": "건넸다", "L": "", "T": ""}, "order": ["S", "T", "O", "P"], "hint": "동생은 누구에게 선물을 건넸을까?"}, {"missing": "S", "parts": {"S": "", "O": "노래를", "P": "불렀다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "누가 노래를 불렀을까?"}, {"missing": "O", "parts": {"S": "친구들이", "O": "", "P": "기다렸다", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "친구들은 무엇 또는 누구를 기다렸을까?"}, {"missing": "P", "parts": {"S": "형이", "O": "라면을", "P": "", "L": "", "T": ""}, "order": ["S", "O", "P"], "hint": "형은 라면을 어떻게 했을까?"}, {"missing": "L", "parts": {"S": "학생들이", "O": "", "P": "모였다", "L": "", "T": ""}, "order": ["S", "L", "P"], "hint": "학생들은 어디에 모였을까?"}, {"missing": "T", "parts": {"S": "강아지가", "O": "공을", "P": "가져다주었다", "L": "", "T": ""}, "order": ["S", "T", "O", "P"], "hint": "강아지는 누구에게 공을 가져다주었을까?"}];


function freshRoom(roomId) {
  const def = ROOM_DEFS[roomId];
  return {
    roomId,
    roomName: def.name,
    players: [...def.players],
    rounds: JSON.parse(JSON.stringify(BASE_ROUNDS)),
    current: 0,
    phase: 'lobby',
    answers: {},
    submissionOrder: [],
    totals: Object.fromEntries(def.players.map(n => [n, 0])),
    roundResult: null,
    history: []
  };
}

let games = Object.fromEntries(Object.keys(ROOM_DEFS).map(id => [id, freshRoom(id)]));

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const id of Object.keys(ROOM_DEFS)) {
      if (!saved[id]) continue;
      const g = saved[id];
      const base = freshRoom(id);
      games[id] = {
        ...base,
        ...g,
        roomId:id,
        roomName:ROOM_DEFS[id].name,
        rounds:Array.isArray(g.rounds) && g.rounds.length ? g.rounds : base.rounds
      };
    }
  } catch (e) {
    console.error('저장 데이터 불러오기 실패:', e.message);
  }
}
function saveData() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf8'); }
  catch (e) { console.error('저장 실패:', e.message); }
}
loadData();

const clients = new Map(Object.keys(ROOM_DEFS).map(id => [id, new Set()]));

function validRoom(roomId) { return Object.prototype.hasOwnProperty.call(ROOM_DEFS, roomId); }
function roomFrom(url) { return url.searchParams.get('room') || ''; }
function baseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`).split(',')[0].trim();
  return `${proto}://${host}`;
}
function studentStartUrl(req) { return `${baseUrl(req)}/student-start.html`; }
function studentUrl(req, roomId) { return `${baseUrl(req)}/student.html?room=${encodeURIComponent(roomId)}`; }
function teacherUrl(req, roomId) { return `${baseUrl(req)}/teacher.html?room=${encodeURIComponent(roomId)}`; }
function displayUrl(req, roomId) { return `${baseUrl(req)}/display.html?room=${encodeURIComponent(roomId)}`; }

function publicState(roomId) {
  const game = games[roomId];
  return {
    roomId,
    roomName: ROOM_DEFS[roomId].name,
    players: game.players,
    current: game.current,
    totalRounds: game.rounds.length,
    phase: game.phase,
    round: game.rounds[game.current] || null,
    submittedNames: game.submissionOrder.map(x => x.name),
    submittedCount: game.submissionOrder.length,
    totals: game.totals,
    roundResult: game.roundResult,
    historyLength: game.history.length
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1000000) req.destroy();
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function broadcast(roomId) {
  const set = clients.get(roomId);
  if (!set) return;
  const payload = `data: ${JSON.stringify(publicState(roomId))}\n\n`;
  for (const res of set) {
    try { res.write(payload); }
    catch (_) { set.delete(res); }
  }
}

function normalizeForMatch(raw, missing) {
  let s = String(raw || '').trim().replace(/\s+/g,' ').replace(/[.!?。！？]+$/g,'').trim();
  if (missing === 'S') s = s.replace(/(은|는|이|가)$/,'').trim();
  if (missing === 'O') s = s.replace(/(을|를)$/,'').trim();
  if (missing === 'L') s = s.replace(/(에서|으로|로|에)$/,'').trim();
  if (missing === 'T') s = s.replace(/(에게|한테|께)$/,'').trim();
  return s;
}

function normalizeForRepeat(raw) {
  let s = String(raw || '').trim().replace(/\s+/g,' ').replace(/[.!?。！？]+$/g,'').trim().toLowerCase();
  // 반복답 방지는 조사만 바꾼 표현도 같은 답으로 처리
  s = s.replace(/(에게|한테|께|에서|으로|로|은|는|이|가|을|를|에)$/,'').trim();
  return s;
}

function usedBeforeByPlayer(game, playerName, raw) {
  const key = normalizeForRepeat(raw);
  if (!key) return false;
  for (const h of game.history) {
    const previous = h.answers?.[playerName] || '';
    if (normalizeForRepeat(previous) === key) return true;
  }
  return false;
}

function scoreCurrentRound(roomId) {
  const game = games[roomId];
  if (game.phase !== 'answering') return {ok:false,error:'현재 채점할 수 있는 상태가 아닙니다.'};
  const round = game.rounds[game.current];
  const buckets = {};

  for (const name of game.players) {
    const raw = (game.answers[name] || '').trim();
    const key = normalizeForMatch(raw, round.missing);
    if (!key) continue;
    if (!buckets[key]) buckets[key] = {key,display:raw,names:[]};
    buckets[key].names.push(name);
  }

  const bonusMap = Object.fromEntries(game.players.map(n => [n,0]));
  if (game.submissionOrder[0]) bonusMap[game.submissionOrder[0].name] = 1;

  const roundPoints = Object.fromEntries(game.players.map(n => [n,0]));
  const groups = Object.values(buckets).map(g => {
    const matchPoints = g.names.length >= 2 ? g.names.length : 0;
    g.names.forEach(n => roundPoints[n] += matchPoints);
    return {...g,matchPoints};
  }).sort((a,b) => b.names.length-a.names.length || a.display.localeCompare(b.display,'ko'));

  for (const name of game.players) {
    roundPoints[name] += bonusMap[name] || 0;
    game.totals[name] = (game.totals[name] || 0) + roundPoints[name];
  }

  game.roundResult = {
    groups,
    bonusMap,
    roundPoints,
    order: game.submissionOrder.map((x,i) => ({position:i+1,name:x.name,bonus:i===0?1:0}))
  };
  game.history.push({
    roundIndex: game.current,
    answers: {...game.answers},
    result: game.roundResult
  });
  game.phase = 'revealed';
  saveData();
  broadcast(roomId);
  return {ok:true};
}

function serveFile(res, pathname) {
  let file = pathname === '/' ? '/index.html' : pathname;
  const full = path.join(PUBLIC, file.replace(/^\//,''));
  if (!full.startsWith(PUBLIC)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(full,(err,data)=>{
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(full).toLowerCase();
    const types = {
      '.html':'text/html; charset=utf-8',
      '.css':'text/css; charset=utf-8',
      '.js':'application/javascript; charset=utf-8',
      '.svg':'image/svg+xml'
    };
    res.writeHead(200,{'Content-Type':types[ext] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}

const server = http.createServer(async(req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/api/rooms' && req.method === 'GET') {
    const data = Object.entries(ROOM_DEFS).map(([id,def]) => ({
      id, name:def.name, count:games[id].players.length,
      studentUrl:studentUrl(req,id), teacherUrl:teacherUrl(req,id), displayUrl:displayUrl(req,id)
    }));
    return sendJson(res,200,{rooms:data,port:PORT,studentStartUrl:studentStartUrl(req)});
  }

  if (pathname === '/api/roominfo' && req.method === 'GET') {
    const roomId = roomFrom(url);
    if (!validRoom(roomId)) return sendJson(res,404,{ok:false,error:'반을 찾을 수 없습니다.'});
    return sendJson(res,200,{
      ok:true, roomId, roomName:ROOM_DEFS[roomId].name,
      studentUrl:studentUrl(req,roomId), teacherUrl:teacherUrl(req,roomId), displayUrl:displayUrl(req,roomId)
    });
  }

  if (pathname === '/qr' && req.method === 'GET') {
    try {
      const png = await QRCode.toBuffer(studentStartUrl(req), {
        type:'png', margin:2, width:720, errorCorrectionLevel:'M'
      });
      res.writeHead(200, {'Content-Type':'image/png','Cache-Control':'no-store'});
      return res.end(png);
    } catch(e) {
      res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
      return res.end('QR 생성 실패');
    }
  }

  if (pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, {ok:true});
  }

  if (pathname === '/events' && req.method === 'GET') {
    const roomId = roomFrom(url);
    if (!validRoom(roomId)) { res.writeHead(404); return res.end('room not found'); }
    res.writeHead(200,{
      'Content-Type':'text/event-stream; charset=utf-8',
      'Cache-Control':'no-cache',
      'Connection':'keep-alive'
    });
    res.write(`data: ${JSON.stringify(publicState(roomId))}\n\n`);
    clients.get(roomId).add(res);
    req.on('close',()=>clients.get(roomId).delete(res));
    return;
  }

  if (pathname === '/api/submit' && req.method === 'POST') {
    const roomId = roomFrom(url);
    if (!validRoom(roomId)) return sendJson(res,404,{ok:false,error:'반을 찾을 수 없습니다.'});
    const game = games[roomId];
    try {
      const body = await readJson(req);
      const name = String(body.name || '').trim();
      const answer = String(body.answer || '').trim();
      if (game.phase !== 'answering') return sendJson(res,409,{ok:false,error:'지금은 답을 제출할 수 없습니다.'});
      if (!game.players.includes(name)) return sendJson(res,400,{ok:false,error:'이 반 참가자 명단에 없는 이름입니다.'});
      if (!answer) return sendJson(res,400,{ok:false,error:'답을 입력해 주세요.'});
      if (Object.prototype.hasOwnProperty.call(game.answers,name)) return sendJson(res,409,{ok:false,error:'이미 이번 라운드에 제출했습니다.'});
      if (usedBeforeByPlayer(game,name,answer)) {
        return sendJson(res,409,{ok:false,error:'내가 이전 라운드에서 이미 쓴 답이에요! 다른 답을 떠올려 보세요.'});
      }
      game.answers[name] = answer;
      game.submissionOrder.push({name,at:Date.now()});
      saveData();
      broadcast(roomId);
      return sendJson(res,200,{ok:true,position:game.submissionOrder.length,bonus:game.submissionOrder.length===1?1:0});
    } catch(e) {
      return sendJson(res,400,{ok:false,error:'잘못된 요청입니다.'});
    }
  }

  if (pathname.startsWith('/api/teacher/')) {
    const roomId = roomFrom(url);
    if (!validRoom(roomId)) return sendJson(res,404,{ok:false,error:'반을 찾을 수 없습니다.'});
    const game = games[roomId];

    if (pathname === '/api/teacher/start' && req.method === 'POST') {
      if (game.phase === 'finished') return sendJson(res,409,{ok:false,error:'게임이 종료되었습니다.'});
      game.phase='answering'; game.answers={}; game.submissionOrder=[]; game.roundResult=null;
      saveData(); broadcast(roomId); return sendJson(res,200,{ok:true});
    }

    if (pathname === '/api/teacher/reveal' && req.method === 'POST') {
      return sendJson(res,200,scoreCurrentRound(roomId));
    }

    if (pathname === '/api/teacher/next' && req.method === 'POST') {
      if (game.phase !== 'revealed') return sendJson(res,409,{ok:false,error:'먼저 현재 라운드를 채점해 주세요.'});
      if (game.current >= game.rounds.length-1) {
        game.phase='finished'; saveData(); broadcast(roomId);
        return sendJson(res,200,{ok:true,finished:true});
      }
      game.current++; game.phase='answering'; game.answers={}; game.submissionOrder=[]; game.roundResult=null;
      saveData(); broadcast(roomId); return sendJson(res,200,{ok:true});
    }

    if (pathname === '/api/teacher/reset' && req.method === 'POST') {
      // 현재 반만 초기화
      const currentPlayers = [...game.players];
      games[roomId] = freshRoom(roomId);
      games[roomId].players = currentPlayers;
      games[roomId].totals = Object.fromEntries(currentPlayers.map(n => [n,0]));
      saveData(); broadcast(roomId); return sendJson(res,200,{ok:true});
    }

    if (pathname === '/api/teacher/players' && req.method === 'POST') {
      try {
        const body = await readJson(req);
        const list = Array.isArray(body.players) ? body.players.map(x=>String(x).trim()).filter(Boolean) : [];
        if (list.length < 2) return sendJson(res,400,{ok:false,error:'참가자는 2명 이상이어야 합니다.'});
        if (new Set(list).size !== list.length) return sendJson(res,400,{ok:false,error:'같은 이름이 중복되어 있습니다.'});
        game.players=list;
        const nextTotals={};
        list.forEach(n=>nextTotals[n]=game.totals[n]||0);
        game.totals=nextTotals;
        saveData(); broadcast(roomId); return sendJson(res,200,{ok:true});
      } catch(e) {
        return sendJson(res,400,{ok:false,error:'잘못된 요청입니다.'});
      }
    }
  }

  return serveFile(res,pathname);
});

server.listen(PORT,'0.0.0.0',()=>{
  console.log(`Sentence Empathy online server listening on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
