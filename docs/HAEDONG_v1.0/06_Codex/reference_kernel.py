"""New prototype rules, NOT a reconstruction of branch B combat mechanics.
Pure stdlib, no network calls. Minimal accounting/command contract reference.
"""
from dataclasses import dataclass, field
from copy import deepcopy
from random import Random
import hashlib,json

class RuleError(ValueError): pass

def integer(value,name):
    if type(value) is not int or value<0: raise RuleError(name)
    return value

@dataclass
class State:
    available:int=100
    wounded:int=0
    dead:int=0
    initial:int=100
    prisoners:int=0
    released:int=0
    captured:int=0
    grain_g:int=10000
    minute:int=0
    version:int=0
    def validate(self):
        for k,v in vars(self).items():integer(v,k)
        if self.initial != self.available+self.wounded+self.dead:raise RuleError('person conservation')
        if self.captured != self.prisoners+self.released:raise RuleError('prisoner conservation')

@dataclass
class Kernel:
    state:State=field(default_factory=State)
    seed:int=645
    receipts:dict=field(default_factory=dict)
    events:list=field(default_factory=list)
    def submit(self,key,expected_version,operations):
        # Atomic on a deep copy. Does not implement DB concurrency.
        if not isinstance(key,str) or not key:raise RuleError('key')
        integer(expected_version,'version')
        blob=json.dumps({'expected_version':expected_version,'operations':operations},sort_keys=True,separators=(',',':'))
        digest=hashlib.sha256(blob.encode()).hexdigest()
        if key in self.receipts:
            old_hash,old_response=self.receipts[key]
            if digest!=old_hash:raise RuleError('idempotency conflict')
            return deepcopy(old_response)
        if expected_version!=self.state.version:raise RuleError('version conflict')
        nxt=deepcopy(self.state);new_events=[]
        for op in operations:
            allowed={'kind','amount','dead','wounded','minutes'}
            if set(op)-allowed:raise RuleError('unknown or AI state mutation field')
            kind=op.get('kind')
            if kind=='casualty':
                dead=integer(op.get('dead',0),'dead');wounded=integer(op.get('wounded',0),'wounded')
                if dead+wounded>nxt.available:raise RuleError('too many casualties')
                nxt.available-=dead+wounded;nxt.dead+=dead;nxt.wounded+=wounded
            elif kind=='recover':
                n=integer(op.get('amount'),'amount')
                if n>nxt.wounded:raise RuleError('too many recoveries')
                nxt.wounded-=n;nxt.available+=n
            elif kind=='capture':
                n=integer(op.get('amount'),'amount');nxt.prisoners+=n;nxt.captured+=n
            elif kind=='handover':
                n=integer(op.get('amount'),'amount')
                if n>nxt.prisoners:raise RuleError('too many released')
                nxt.prisoners-=n;nxt.released+=n
            elif kind=='consume_grain':
                n=integer(op.get('amount'),'amount')
                if n>nxt.grain_g:raise RuleError('insufficient grain')
                nxt.grain_g-=n
            elif kind=='advance':nxt.minute+=integer(op.get('minutes'),'minutes')
            elif kind=='combat_example':
                # Event-local seed includes committed version and event offset.
                rng=Random(f'{self.seed}:{self.state.version}:{len(new_events)}')
                n=rng.randint(0,min(nxt.available,5));nxt.available-=n;nxt.wounded+=n
                op={**op,'resolved_wounded':n}
            else:raise RuleError('unsupported operation')
            nxt.validate();new_events.append(deepcopy(op))
        nxt.version+=1;nxt.validate()
        response={'version':nxt.version,'state':vars(nxt).copy(),'events':new_events}
        self.state=nxt;self.events.extend(new_events);self.receipts[key]=(digest,deepcopy(response))
        return response

def validate_orders(orders):
    seen=set()
    for o in orders:
        if set(o)-{'unit_id','kind','target_node'}:raise RuleError('unpermitted AI field')
        if o.get('kind') not in {'move','defend','recon','wait','aid'}:raise RuleError('kind')
        uid=o.get('unit_id')
        if not isinstance(uid,str) or not uid or uid in seen:raise RuleError('unit conflict')
        seen.add(uid)

def advance_until(current,duration,event_times,policy='critical'):
    integer(current,'current');integer(duration,'duration')
    if policy not in {'all','critical','none'}:raise RuleError('interrupt policy')
    stop=current+duration
    for at,importance in sorted(event_times):
        if not current<at<=stop:continue
        if policy=='all' or (policy=='critical' and importance=='critical'):
            return {'minute':at,'elapsed':at-current,'remaining':stop-at,'interrupted':True}
    return {'minute':stop,'elapsed':duration,'remaining':0,'interrupted':False}
