import { useState } from "react";
import { Bomb, Coins, Gem } from "lucide-react";
import { useAct, useGame } from "@/hooks/use-game";
import { CASINO } from "@/game/config";
import { handValue, hiloOdds, hiloStepMult, minesMultiplier, RED, type Card as PCard, type CasinoState, type RouletteBet } from "@/game/casino";
import { money } from "@/lib/format";
import { Card, Loading, Pill } from "@/components/game/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GAMES = ["Roulette","Blackjack","Mines","Keno","Hi-Lo"] as const;
type G = typeof GAMES[number];
const fmt=(n:number)=>n.toLocaleString("en-US",{maximumFractionDigits:2});
const EMPTY:CasinoState={chips:0,round:0,active:null,last:null,stats:{wagered:0,won:0,rounds:0,biggestWin:0}};


const SUITS = ["♠", "♥", "♦", "♣"];

export function CasinoTable({ initialGame = "Roulette" }: { initialGame?: G }) {
 const { data } = useGame();
 const [game, setGame] = useState<G>(initialGame);
 if (!data) return <Loading />;
 const cs = data.state.casino ?? EMPTY;
 const active = cs.active ? ({ blackjack: "Blackjack", mines: "Mines", hilo: "Hi-Lo" } as const)[cs.active.game] : null;
 const current = active ?? game;
 return <div className="cf-casino-stage" key={current}>
  <div className="cf-casino-wallet">
   <div className="cf-wallet-chips"><span className="cf-eyebrow">TABLE WALLET</span><strong><span className="cf-chip-coin">◉</span>{fmt(cs.chips)}</strong><small>VIRTUAL CHIPS</small></div>
   <div className="cf-wallet-cash"><span className="cf-eyebrow">GAME CASH</span><strong>{money(data.state.cash)}</strong><small>EXCHANGE ONLY</small></div>
  </div>
  <Exchange cash={data.state.cash} chips={cs.chips}/>
  <div className="cf-table-switcher" role="tablist" aria-label="Casino games">
   {GAMES.map(x=><button key={x} role="tab" aria-selected={current===x} disabled={!!active&&active!==x} onClick={()=>setGame(x)} className={current===x?"is-active":""}><span>{({Roulette:"◉",Blackjack:"♠",Mines:"✦",Keno:"✺","Hi-Lo":"♦"} as Record<G,string>)[x]}</span>{x}</button>)}
  </div>
  <div className="cf-game-stage" key={current}>
   <div className="cf-game-heading"><div><span className="cf-live-dot"/> LIVE TABLE <span className="cf-game-tag">{current.toUpperCase()}</span></div><span>TABLE {String(GAMES.indexOf(current)+1).padStart(2,"0")}</span></div>
   {current==="Roulette"&&<Roulette cs={cs}/>}
   {current==="Blackjack"&&<Blackjack cs={cs}/>}
   {current==="Mines"&&<Mines cs={cs}/>}
   {current==="Keno"&&<Keno cs={cs}/>}
   {current==="Hi-Lo"&&<Hilo cs={cs}/>}
  </div>
  <div className="cf-casino-stats">
   <div><span>ROUNDS</span><strong>{cs.stats.rounds}</strong></div>
   <div><span>WAGERED</span><strong>{fmt(cs.stats.wagered)}</strong></div>
   <div><span>NET RESULT</span><strong className={cs.stats.won-cs.stats.wagered>=0?"is-positive":"is-negative"}>{fmt(cs.stats.won-cs.stats.wagered)}</strong></div>
  </div>
 </div>;
}

function Exchange({cash,chips}:{cash:number;chips:number}) {
 const {run,pending}=useAct(); const [n,setN]=useState("10"); const v=Math.floor(Number(n)||0);
 return <details className="cf-cashier">
  <summary><span><span className="cf-cashier-icon">✧</span><b>CHIP EXCHANGE</b><small>1 chip = {money(CASINO.chipValue)}</small></span><span className="cf-cashier-chevron">⌄</span></summary>
  <div className="cf-cashier-body">
   <div className="cf-cashier-input"><label htmlFor="casino-chip-amount">CHIP AMOUNT</label><Input id="casino-chip-amount" inputMode="numeric" value={n} onChange={e=>setN(e.target.value.replace(/[^\d]/g,""))} aria-label="Virtual chips to exchange"/><Button variant="outline" onClick={()=>setN(String(Math.floor(cash/CASINO.chipValue)))}>MAX</Button></div>
   <div className="cf-cashier-value">{fmt(v)} chips · {money(v*CASINO.chipValue)}</div>
   <div className="cf-cashier-actions"><Button disabled={pending||v<1||cash<v*CASINO.chipValue} onClick={()=>run({type:"buyChips",chips:v},`Exchanged game cash for ${v} virtual chips`)}>BUY CHIPS</Button><Button variant="outline" disabled={pending||v<1||chips<v} onClick={()=>run({type:"sellChips",chips:v},`Exchanged ${v} virtual chips to game cash`)}>CASH OUT</Button></div>
  </div>
 </details>;
}

function BetInput({bet,setBet,chips,disabled}:{bet:string;setBet:(v:string)=>void;chips:number;disabled?:boolean}) {
 const b=Number(bet)||0;
 return <div className="cf-bet-control"><label>YOUR STAKE <span>VIRTUAL CHIPS</span></label><div className="cf-bet-row"><Input inputMode="decimal" value={bet} disabled={disabled} onChange={e=>setBet(e.target.value.replace(/[^\d.]/g,""))} aria-label="Stake in virtual chips"/><Button variant="outline" size="sm" disabled={disabled} onClick={()=>setBet(String(Math.max(1,Math.floor(b/2))))}>½</Button><Button variant="outline" size="sm" disabled={disabled} onClick={()=>setBet(String(Math.min(chips,Math.max(1,b*2))))}>2×</Button><Button variant="outline" size="sm" disabled={disabled} onClick={()=>setBet(String(Math.floor(Math.min(chips,CASINO.maxBet))))}>MAX</Button></div></div>;
}

function TableResult({cs,game}:{cs:CasinoState;game:string}) {
 const l=cs.last; if(!l||l.game!==game)return null; const net=l.payout-l.bet;
 return <div className={`cf-table-result ${net>0?"is-win":net===0?"is-push":"is-loss"}`} key={l.at}>
  <span className="cf-result-flare">{net>0?"✦":net===0?"◇":"◈"}</span>
  <span className="cf-result-title">{net>0?"ROUND WON":net===0?"STALEMATE":"ROUND LOST"}</span>
  <strong>{net>0?"+":""}{fmt(net)} <small>CHIPS</small></strong>
  <span className="cf-result-total">PAYOUT {fmt(l.payout)} · STAKE {fmt(l.bet)}</span>
 </div>;
}

function PlayingCard({c,hidden,dealIndex=0}:{c?:PCard;hidden?:boolean;dealIndex?:number}) {
 if(!c||hidden)return <div className="cf-playing-card is-hidden" style={{"--deal-index":dealIndex} as React.CSSProperties}><span>CF</span><b>♠</b></div>;
 const rank=["","A","2","3","4","5","6","7","8","9","10","J","Q","K"][c.r],suit=SUITS[c.s];
 return <div className={`cf-playing-card ${c.s===1||c.s===2?"is-red":""}`} style={{"--deal-index":dealIndex} as React.CSSProperties}><span>{rank}</span><b>{suit}</b><i>{rank}{suit}</i></div>;
}

function GamePanel({children,className=""}:{children:React.ReactNode;className?:string}) {
 return <section className={`cf-table-panel ${className}`}>{children}</section>;
}

function Roulette({cs}:{cs:CasinoState}) {
 const {run,pending}=useAct(); const [bet,setBet]=useState("1"); const [bets,setBets]=useState<RouletteBet[]>([]);
 const amt=Number(bet)||0,total=bets.reduce((t,b)=>t+b.amount,0);
 const add=(kind:RouletteBet["kind"],value?:number)=>{if(amt<1)return;setBets(x=>{const i=x.findIndex(b=>b.kind===kind&&b.value===value);return i>=0?x.map((b,j)=>j===i?{...b,amount:b.amount+amt}:b):[...x,(value===undefined?{kind,amount:amt}:{kind,value,amount:amt})]})};
 const on=(kind:string,value?:number)=>bets.find(b=>b.kind===kind&&b.value===value)?.amount;
 const n=cs.last?.game==="roulette"?cs.last.detail.number as number:null;
 const outcomeClass=n===null?"":n===0?"is-green":RED.has(n)?"is-red":"is-black";
 const wheelOrder=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
 return <GamePanel className="cf-roulette-panel">
  <div className="cf-table-title-row"><div><span className="cf-eyebrow">EUROPEAN ROULETTE</span><h2>Place your bets</h2></div><span className="cf-house-mark">CAPITAL <b>CLUB</b></span></div>
  <div className={`cf-wheel-wrap ${pending?"is-spinning":""}`}>
   <div className="cf-wheel-halo"/>
   <div className="cf-wheel-outer">
    <div className="cf-wheel-track"/>
    <div className="cf-wheel-numbers">{wheelOrder.map((num,i)=><span key={num} className={`cf-wheel-pocket ${num===0?"is-green":RED.has(num)?"is-red":"is-black"}`} style={{"--pocket-index":i} as React.CSSProperties}>{num}</span>)}</div>
    <div className="cf-wheel-inner"><span className="cf-wheel-center">CF</span></div>
    <div className="cf-wheel-ball" />
   </div>
   <div className="cf-wheel-result"><span>{n===null?"LAST RESULT":"WINNING NUMBER"}</span><strong className={outcomeClass}>{n===null?"—":n}</strong><small>{n===null?"PLACE A BET TO PLAY":n===0?"GREEN ZERO":RED.has(n)?"RED POCKET":"BLACK POCKET"}</small></div>
  </div>
  <div className="cf-felt-board">
   <div className="cf-zero-cell"><button onClick={()=>add("straight",0)} className={on("straight",0)?"is-selected":""}>0<span>{on("straight",0)?fmt(on("straight",0)!):"STRAIGHT"}</span></button></div>
   <div className="cf-number-grid">{Array.from({length:36},(_,i)=>i+1).map(x=><button key={x} onClick={()=>add("straight",x)} className={`${RED.has(x)?"is-red":"is-black"} ${on("straight",x)?"is-selected":""}`}>{x}{on("straight",x)&&<i>{fmt(on("straight",x)!)}</i>}</button>)}</div>
   <div className="cf-bet-type-grid">
    {[1,2,3].map(d=><button key={d} onClick={()=>add("dozen",d)} className={on("dozen",d)?"is-selected":""}>{["1ST 12","2ND 12","3RD 12"][d-1]}{on("dozen",d)&&<i>{fmt(on("dozen",d)!)}</i>}</button>)}
    {[1,2,3].map(d=><button key={"c"+d} onClick={()=>add("column",d)} className={on("column",d)?"is-selected":""}>COLUMN {d}{on("column",d)&&<i>{fmt(on("column",d)!)}</i>}</button>)}
   </div>
   <div className="cf-outside-bets">{[
    ["low","1–18"],["even","EVEN"],["red","RED"],["black","BLACK"],["odd","ODD"],["high","19–36"]
   ].map(([kind,label])=><button key={kind} onClick={()=>add(kind as RouletteBet["kind"])} className={`cf-outside-${kind} ${on(kind)?"is-selected":""}`}>{label}{on(kind)&&<i>{fmt(on(kind)!)}</i>}</button>)}</div>
  </div>
  <div className="cf-bet-footer"><BetInput bet={bet} setBet={setBet} chips={cs.chips}/><div className="cf-total-wager"><span>TOTAL ON TABLE</span><strong>{fmt(total)} <small>CHIPS</small></strong></div></div>
  <div className="cf-game-actions"><Button variant="outline" disabled={!bets.length||pending} onClick={()=>setBets([])}>CLEAR BETS</Button><Button disabled={pending||!bets.length||total>cs.chips} onClick={()=>run({type:"casinoRoulette",bets})} className="cf-primary-action">{pending?"WHEEL SPINNING…":"SPIN THE WHEEL"}</Button></div>
  <TableResult cs={cs} game="roulette"/>
 </GamePanel>;
}

function Blackjack({cs}:{cs:CasinoState}) {
 const {run,pending}=useAct(); const [bet,setBet]=useState("10"); const st=cs.active?.game==="blackjack"?cs.active:null;
 const last=!st&&cs.last?.game==="blackjack"?cs.last.detail as {player:PCard[];dealer:PCard[];outcome:string;pv:number;dv:number}:null;
 const player=st?.player??last?.player??[],dealer=st?st.dealer:last?.dealer??[];
 return <GamePanel className="cf-blackjack-panel">
  <div className="cf-table-title-row"><div><span className="cf-eyebrow">21 · CLASSIC TABLE</span><h2>Blackjack</h2></div><span className="cf-house-mark">THE <b>DEALER</b></span></div>
  <div className="cf-blackjack-felt">
   <div className="cf-card-zone"><div className="cf-hand-label">DEALER <b>{dealer.length?handValue(dealer).total:"—"}</b></div><div className="cf-card-row">{dealer.map((c,i)=><PlayingCard key={i} c={c} dealIndex={i}/>) }{st&&<PlayingCard hidden dealIndex={dealer.length}/>}</div></div>
   <div className="cf-table-ornament"><span>✦</span><i>BLACKJACK PAYS 3 : 2</i><span>✦</span></div>
   <div className="cf-card-zone"><div className="cf-hand-label">YOUR HAND <b>{player.length?handValue(player).total:"—"}</b></div><div className="cf-card-row">{player.map((c,i)=><PlayingCard key={i} c={c} dealIndex={i}/>)}</div></div>
   {last&&<div className="cf-blackjack-outcome">{last.outcome.toUpperCase()}</div>}
  </div>
  {st?<div className="cf-blackjack-actions"><Button disabled={pending} onClick={()=>run({type:"casinoBlackjack",move:"hit"})}>HIT</Button><Button variant="outline" disabled={pending} onClick={()=>run({type:"casinoBlackjack",move:"stand"})}>STAND</Button><Button variant="outline" disabled={pending||st.player.length!==2||cs.chips<st.bet} onClick={()=>run({type:"casinoBlackjack",move:"double"})}>DOUBLE</Button></div>:<div className="cf-new-round"><BetInput bet={bet} setBet={setBet} chips={cs.chips}/><Button disabled={pending||!(Number(bet)>=1)||Number(bet)>cs.chips} onClick={()=>run({type:"casinoBlackjack",move:"start",bet:Number(bet)})} className="cf-primary-action">DEAL CARDS</Button><small>DEALER STANDS ON 17 · VIRTUAL CHIPS ONLY</small></div>}
  <TableResult cs={cs} game="blackjack"/>
 </GamePanel>;
}

function Mines({cs}:{cs:CasinoState}) {
 const {run,pending}=useAct(); const [bet,setBet]=useState("10"); const [mines,setMines]=useState(3); const st=cs.active?.game==="mines"?cs.active:null;
 const last=!st&&cs.last?.game==="mines"?cs.last.detail as {mines:number[];revealed:number[];hit?:number;boom?:boolean}:null;
 const revealed=st?.revealed??last?.revealed??[],m=st?.mines??mines,cur=minesMultiplier(m,revealed.length);
 return <GamePanel className="cf-mines-panel">
  <div className="cf-table-title-row"><div><span className="cf-eyebrow">GEM HUNT · 5 × 5</span><h2>Find the fortune</h2></div><span className="cf-mines-badge"><Gem size={15}/> {m} MINES</span></div>
  <div className="cf-mines-stage">
   <div className="cf-multiplier-lens"><span>CURRENT MULTIPLIER</span><strong>{cur.toFixed(2)}<i>×</i></strong><small>{st?fmt(st.bet*cur):"WAITING FOR ROUND"}</small></div>
   <div className="cf-mines-grid">{Array.from({length:25},(_,i)=>{const open=revealed.includes(i),isMine=!!last?.mines.includes(i),hit=last?.hit===i;return <button key={i} disabled={!st||open||pending} onClick={()=>run({type:"casinoMines",move:"reveal",tile:i})} className={`cf-mine-tile ${open?"is-gem":""} ${isMine?"is-mine":""} ${hit?"is-hit":""} ${st?"is-live":""}`}>{open?<><Gem/><i>GEM</i></>:isMine?<Bomb/>:<span>✦</span>}</button>})}</div>
   {last?.boom&&<div className="cf-mines-bust">MINE TRIGGERED · ROUND OVER</div>}
  </div>
  {st?<div className="cf-new-round"><div className="cf-active-value"><span>POTENTIAL CASH OUT</span><strong>{fmt(st.bet*cur)} <small>CHIPS</small></strong></div><Button disabled={pending||!st.revealed.length} onClick={()=>run({type:"casinoMines",move:"cashout"})} className="cf-primary-action">COLLECT WINNINGS</Button></div>:<div className="cf-new-round"><BetInput bet={bet} setBet={setBet} chips={cs.chips}/><label className="cf-mine-range">MINE COUNT <b>{mines}</b><input type="range" min={1} max={24} value={mines} onChange={e=>setMines(Number(e.target.value))} aria-label="Number of mines"/></label><Button disabled={pending||!(Number(bet)>=1)||Number(bet)>cs.chips} onClick={()=>run({type:"casinoMines",move:"start",bet:Number(bet),mines})} className="cf-primary-action">START GEM HUNT</Button></div>}
  <TableResult cs={cs} game="mines"/>
 </GamePanel>;
}

function Keno({cs}:{cs:CasinoState}) {
 const {run,pending}=useAct(); const [bet,setBet]=useState("10"); const [picks,setPicks]=useState<number[]>([]);
 const last=cs.last?.game==="keno"?cs.last.detail as {draw:number[];picks:number[];hits:number;mult:number}:null;
 const drawn=new Set(last?.draw??[]);
 const toggle=(n:number)=>setPicks(p=>p.includes(n)?p.filter(x=>x!==n):p.length<10?[...p,n]:p);
 return <GamePanel className="cf-keno-panel">
  <div className="cf-table-title-row"><div><span className="cf-eyebrow">LUCKY DRAW · 01—80</span><h2>Pick your numbers</h2></div><span className="cf-mines-badge">{picks.length}/10 PICKS</span></div>
  <div className="cf-keno-stage">
   <div className="cf-keno-orbit"><div className="cf-keno-ball">✦</div><span>20 NUMBERS DRAWN</span></div>
   <div className="cf-keno-grid">{Array.from({length:80},(_,i)=>i+1).map(n=><button key={n} onClick={()=>toggle(n)} disabled={pending} className={`cf-keno-number ${picks.includes(n)?"is-picked":""} ${drawn.has(n)?"is-drawn":""} ${drawn.has(n)&&picks.includes(n)?"is-hit":""}`}>{n}</button>)}</div>
   {last&&<div className="cf-keno-summary"><strong>{last.hits} / {last.picks.length}</strong><span>NUMBERS MATCHED · {last.mult.toFixed(2)}× PAYOUT</span></div>}
  </div>
  <div className="cf-new-round"><BetInput bet={bet} setBet={setBet} chips={cs.chips}/><div className="cf-keno-actions"><Button variant="outline" disabled={pending} onClick={()=>setPicks(picks.length?[]:Array.from({length:80},(_,i)=>i+1).sort(()=>Math.random()-.5).slice(0,10))}>{picks.length?"CLEAR PICKS":"QUICK PICK"}</Button><Button className="cf-primary-action" disabled={pending||!picks.length||!(Number(bet)>=1)||Number(bet)>cs.chips} onClick={()=>run({type:"casinoKeno",bet:Number(bet),picks})}>DRAW NUMBERS</Button></div></div>
  <TableResult cs={cs} game="keno"/>
 </GamePanel>;
}

function Hilo({cs}:{cs:CasinoState}) {
 const {run,pending}=useAct(); const [bet,setBet]=useState("10"); const st=cs.active?.game==="hilo"?cs.active:null;
 const last=!st&&cs.last?.game==="hilo"?cs.last.detail as {history:PCard[];won?:boolean}:null;
 const history=st?.history??last?.history??[],odds=st?hiloOdds(st.card.r):null,current=st?.card??history.at(-1);
 return <GamePanel className="cf-hilo-panel">
  <div className="cf-table-title-row"><div><span className="cf-eyebrow">HIGH CARD · MULTIPLIER RUN</span><h2>Higher or lower?</h2></div><span className="cf-house-mark">CARD <b>DUEL</b></span></div>
  <div className="cf-hilo-stage">
   <div className="cf-hilo-stats"><div><span>STREAK</span><strong>{Math.max(0,history.length-1)}</strong></div><div><span>MULTIPLIER</span><strong>{st?.mult.toFixed(2)??"1.00"}×</strong></div><div><span>ROUND VALUE</span><strong>{st?fmt(st.bet*st.mult):"—"}</strong></div></div>
   <div className="cf-hilo-card-wrap">{current?<PlayingCard c={current}/>:<div className="cf-card-placeholder">?</div>}<div className="cf-hilo-card-caption">{current?({1:"ACE",11:"JACK",12:"QUEEN",13:"KING"}[current.r]??String(current.r)):"READY TO DRAW"}</div></div>
   <div className="cf-hilo-history">{history.slice(-5,-1).map((c,i)=><PlayingCard key={i} c={c} dealIndex={i}/>)}</div>
  </div>
  {st&&odds?<div className="cf-hilo-actions"><Button disabled={pending||odds.higher<=0} onClick={()=>run({type:"casinoHilo",move:"higher"})}><span>↑</span> HIGHER <small>{Math.round(odds.higher*100)}%</small></Button><Button disabled={pending} onClick={()=>run({type:"casinoHilo",move:"lower"})}><span>↓</span> LOWER <small>{Math.round(odds.lower*100)}%</small></Button><Button variant="outline" disabled={pending||st.mult<=1} onClick={()=>run({type:"casinoHilo",move:"cashout"})}>COLLECT {fmt(st.bet*st.mult)}</Button></div>:<div className="cf-new-round"><BetInput bet={bet} setBet={setBet} chips={cs.chips}/><Button className="cf-primary-action" disabled={pending||!(Number(bet)>=1)||Number(bet)>cs.chips} onClick={()=>run({type:"casinoHilo",move:"start",bet:Number(bet)})}>DRAW FIRST CARD</Button></div>}
  <TableResult cs={cs} game="hilo"/>
 </GamePanel>;
}
