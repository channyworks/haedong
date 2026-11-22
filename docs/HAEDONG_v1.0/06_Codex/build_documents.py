from pathlib import Path
import json,re
from docx import Document
from docx.shared import Mm,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
R=Path(__file__).resolve().parents[1]; B=R/'07_GameData'
def read(n):return json.loads((B/n).read_text())
def save(p,t):(R/p).write_text(t,encoding='utf8')
refs='''# 출처·원문·미확인 자료

## 분류 기준

H는 역사 골격, G는 기존 분기 B 복원 요약, N은 신규 창작·설계, U는 미확인이다. 본권에 나오는 성주의 구체적 대사·눈썹 흉터·성격 장면·날씨·보초 신호·생활도구·시각별 지시·의료 절차는 N이다. G에서 확인되는 것은 사건 제목과 기록된 수치이며, 그 사이의 상세 전술을 소설 장면으로부터 사실로 추출해서는 안 된다.

## 1차 프로젝트 자료

업로드 haedong_v01.zip을 원본으로 보존했다. 09_References/v01_original에 압축 내 파일을 그대로 복사하고 source_hashes.json에 SHA-256을 기록했다. ansi_branch_b.json은 25건의 reconstructed_summary이며, POST_003은 source_status가 visible prior report; indices fictional이다. 원래 대화·Demo 전체 로그·B023 전체 저장 파일은 확보하지 못했다. 원본 ZIP도 별도 사본으로 포함한다.

첨부 1000092305.jpg는 제작 요구·폴더 구조·분량·전술지도10~15점·사건삽화20~30점·인물15~20명의 안내 화면이다. 실제 전투의 원문 증거나 인물 외형 참고 그림이 아니다. 10개 폴더, 지도12, 사건삽화20, 인물20을 제작 기준으로 삼았다.

## 역사 확인에 사용한 공개 자료

1. 국사편찬위원회 우리역사넷 「고구려와 당의 전쟁」. https://contents.history.go.kr/front/hm/view.do?levelId=hm_014_0020 . 열람 2026-11-21. 안시성 저항·토산 공방·당 철수·성주 이름의 후대 전승과 고연수의 항복이라는 골격을 확인했다. 정확한 원전 전체에 대한 교감이나 모든 병력 수치의 역사 검증은 하지 않았다.
2. 국사편찬위원회 한국사데이터베이스 『삼국사기』 권21 고구려본기9 보장왕4년 「고연수의 군대가 항복하다」. https://db.history.go.kr/id/sg_021r_0020_0218 . 공개 검색에서 항복 기사를 확인했다. 이 작품의 고연수 성내 지휘관 배역은 해당 역사와 의도적으로 다르다.

역사 달력의 645년과 게임의 상대17~150일차를 구분한다. 토산 붕괴의 정밀 원인·정확한 성주 외형·협곡 위치는 확인하지 않았다. 굴착이 붕괴 원인이라고 단정하지 않는다. 연남생은 645년의 소년 배역이며 주요 성인 장수처럼 군권을 주지 않는다.

## 구현 설계에 사용한 공식 문서

- FastAPI SQL (Relational) Databases: https://fastapi.tiangolo.com/tutorial/sql-databases/ . DB 라이브러리 선택과 API 계층 분리의 참고.
- Vue Using Vue with TypeScript: https://vuejs.org/guide/typescript/overview.html . 프런트엔드 타입 계약 참고.
- MySQL 8.4 Locking Reads: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html . SELECT FOR UPDATE 직렬화 설계 참고.
- LangGraph Persistence: https://docs.langchain.com/oss/python/langgraph/persistence . AI 워크플로 체크포인트 개념 참고. 체크포인트를 전쟁 수치의 권위 저장소로 사용하지 않는 선택은 본 프로젝트 설계다.
- Ollama Structured Outputs: https://docs.ollama.com/capabilities/structured-outputs . 로컬 모델 응답을 JSON schema로 제한하는 설계 참고.

모두 열람일 2026-11-21. 엔진 공식·API 경로·DB테이블·시간 우선순위·UI는 위 문서의 원문이 아니라 HAEDONG의 신규 설계다. 네트워크 서비스 실제 통합 시험은 수행하지 않았다.

## 미확인 사항의 처리

B022·POST_000·POST_001 가용병력은 null. source_status는 변경하지 않는다. B021 선송환146과 최종 선송환183 사이37명의 상세 경위는 미확인이다. 소설의 146을 누계183으로 바꾸지 않았다. 최종잔류0은 양쪽 값을 반영한 누계 회계다. 수레80·48·120은 물량으로 더하지 않는다. 독립군3000과 귀환민1420은 직속군에서 빼거나 더하지 않는다.
'''
save('09_References/REFERENCES.md',refs)
notes={
'START':'토산 완성도와 구원군 출진은 참조 초기조건이다. 양만춘이 실제로 수신한 정보와 엔진의 전체 사실 상태를 분리한다.',
'B004':'역습 뒤의 정찰·치료라는 사건만 확인된다. 개별 출진 병력·손실·치유량과 공격 동선은 미확인이다.',
'B005':'중장보병과 기동대의 출진은 확인되나 각 부대의 정확한 병력 분배는 원문이 없다.',
'B006':'협곡 북쪽의 접촉이 확인된다. 실제 좌표·지형 폭·최초 발견자는 소설에서 창작했다.',
'B007':'서쪽 우회 시도라는 결과를 보존한다. 정찰병의 부상과 신호 장면은 신규 창작이다.',
'B008R':'B008을 대체하는 저장점이다. 두 기록을 별도 전투로 중복 집계하지 않는다. 선발대 탈출 시작과 전원 합류는 다르다.',
'B009':'두 번째 방어선 돌파와 선발대 합류가 확인된다. 합류인원을 직속군 증원으로 일괄 산입하지 않는다.',
'B010':'양덕의 기습과 구원군 도착을 보존한다. 구원군의 소유권은 독립군이며 양덕의 기습 동선은 창작이다.',
'B011':'남북 협공과 오골성 수레80대 도착. 수레의 적재량이 없으므로 보급지수 증가량을 계산할 수 없다.',
'B012':'휴식과 포로 조사. 가용 병력 증가는 회복 등의 가능성이 있으나 정확한 원인은 미확인이다.',
'B013':'저장시각05:51과 그 이전 사건03:12를 구분한다. 토산 붕괴 원인을 공병의 단일 성공으로 확정하지 않는다.',
'B014':'반격 격퇴는 G. 전투 대사·교대·성벽 손상 세부는 N이다.',
'B015':'토산 점령이 확인된다. 점령이 곧 안전한 진지 완성이나 전쟁 종료를 뜻하지 않는다.',
'B016':'외곽 공성진지 점령. 구간 가용 감소를 모두 전사로 해석하지 않는다.',
'B017':'수레48대 확보와 휴전 제안. 확보 차량과 새 곡식의 양을 혼동하지 않는다. 제안은 합의 발효가 아니다.',
'B018':'차단진지와 포로1821이 확인된다. 포로 수는 직속병력과 별도의 집합이다.',
'B019':'철군 조건 협상. 합의 세부 문구는 미확보이므로 소설 대사와 엔진의 계약안은 신규 창작이다.',
'B020':'09:02 휴전 발효와10:16 철군 시작은 사건시각. 저장시각은11:51이며 세 시각을 합치지 않는다.',
'B021':'포로146 송환과 수레120 도착. 최종 선송환183의 부분 기록이며 나머지37의 인계별 내역은 미확인이다.',
'B022':'가용병력 미확인. 다음 군령에서 부상369·포로1647 확인이라는 복원 요약을 그대로 보존하며 이 시각의 완전 상태로 확대하지 않는다.',
'B023':'완전 철군·가용21932·포로1638·S+98. 전체 원본 저장점은 미확보다. 점수의 정식 평가함수는 알 수 없다.',
'POST_000':'전후 서사의 시작. 가용병력을 앞뒤 저장점으로 보간하지 않는다.',
'POST_001':'특별 은전·복구·조정 포상. 포상 품목·관등의 정밀 목록은 미확인이다.',
'POST_002':'왕명 수락·교환 교섭·양덕 발탁·가용22111. 별도 독립군3000의 출처 흐름을 직속군 이동으로 확정하지 않는다.',
'POST_003':'마지막 기준 저장점. 병력·부대합계·포로의 최종 정산은 검증 가능하나 구간별 유량은 미확인이다.'}
rows=read('ansi_branch_b.json')
sc='# 공식 시나리오북 · 안시성의 불멸\n\n## 독법\n\n공식은 이 패키지의 공통 기준을 뜻하며 역사적 사실 인증을 뜻하지 않는다. G는 업로드 v0.1 복원 요약, N은 신규 소설 장면과 게임 설계, U는 원문 부재다. 상대 일차를 역사 날짜로 바꾸지 않는다.\n\n## 전투·전후 전체 연표\n\n|저장점|상대일차 시각|가용병력|사건|\n|---|---|---:|---|\n'
for x in rows:sc+=f"|{x['save']}|{x['time']}|{x['available'] if x['available'] is not None else '미확인'}|{x['event']}|\n"
sc+='\n## 장면별 기준 카드\n\n'
for i,x in enumerate(rows):
    sc+=f"### {i+1:02}. {x['save']} · {x['event']}\n\n시각: 상대 {x['time']}. 기록 가용: {x['available'] if x['available'] is not None else 'null / 미확인'}. 출처: ansi_branch_b.json[{i}], reconstructed_summary.\n\n확인과 한계: {notes[x['save']]}\n\n게임 적용: 참조 열람에서는 이 사건을 변경하지 않는다. 신규 플레이에서는 상태·명령·이동·정보·확률 판정으로 성패를 결정하며 이 결과를 강제하지 않는다. 소설의 현장 대사는 엔진 입력의 사실 데이터가 아니다.\n\n"
sc+='''## 최종 회계

직속군23010 = 전사897 + 부상0 + 가용22113. 부대별6993+4802+3400+2179+1653+3086=22113. 포로1821=선송환183+교환1638+잔류0. 귀환고구려1420과 양덕독립3000은 별도 계정이다. B023 가용21932에서 POST_00322113까지의181 증가는 구간별 회복·이동 원장이 없어 원인 분해할 수 없다.

보급78.6, 재정67, 명성3600, 영향력58은 게임 지표다. 병력과 더하지 않고 곡식 중량으로 환산하지 않는다. 중간 병력이 오르내리는 것은 기록 사실이지만 전사·부상·회복 흐름을 역산하여 꾸미지 않는다.

## 재플레이 분기 설계

- 협곡 돌파 실패: 구원군이 우회하거나 지연되고 성의 보급 압박이 커질 수 있다.
- 토산 기회 상실: 적이 재점령하면 성벽 압박이 이어진다. 참조의 점령 결과를 자동 적용하지 않는다.
- 휴전 결렬: 추가 전투·자원 고갈·장기 포위가 가능하다.
- 철군 조건 변경: 교환의 시점과 대상이 달라진다. 승인만으로 포로를 장부에서 빼지 않는다.
- 성 함락: 저장 가능한 실패 결말이다. AI가 서사로 함락을 취소할 수 없다.

이 분기들은 모두 N 설계이며 기존 B 기록에 실제 발생했던 추가 사건으로 삽입하지 않는다.

## 소설 대응과 시점

서장~2장은 생활·토산·초기 역습,3~8장은 협곡과 구원,9~13장은 휴식·토산·외곽전,14~21장은 협상·철군,22~종장은 전후 복구·교환·인사·겨울이다. 적 황제 장면은 전지적 시점으로 분리된다. 성주가 그 대화를 첩보로 이미 안 것처럼 행동하지 않는다. 솔의 아버지 귀환은 확인할 자료가 없어 신규 해피엔딩으로 확정하지 않았다.

## 지도집

다음12종은 전술 관계를 비교하기 위한 N 개념도다. 실측 지리·사료상의 정확한 부대배치를 나타내지 않는다.
'''
for m in read('maps.json'):sc+=f"\n### {m['title']}\n\n{m['phase']}\n\n![{m['title']}](../05_Maps/{m['id']}.png)\n"
save('02_Scenario/SCENARIO_BOOK.md',sc)

def setup(title,pocket=False):
    d=Document();s=d.sections[0]
    s.page_width=Mm(120 if pocket else 210);s.page_height=Mm(180 if pocket else 297)
    s.top_margin=s.bottom_margin=Mm(15 if pocket else 20);s.left_margin=s.right_margin=Mm(14 if pocket else 20)
    styles=d.styles
    for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3','Caption']:
        st=styles[name];st.font.name='Noto Serif CJK KR' if pocket else 'Noto Sans CJK KR';st._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),st.font.name)
    st=styles['Normal'];st.font.size=Pt(12 if pocket else 10)
    st.paragraph_format.line_spacing=Pt(18 if pocket else 16)
    st.paragraph_format.space_after=Pt(6 if pocket else 5)
    st.paragraph_format.widow_control=True
    for name,size in [('Heading 1',17 if pocket else 20),('Heading 2',14 if pocket else 14),('Heading 3',12)]:
        styles[name].font.size=Pt(size);styles[name].font.color.rgb=RGBColor.from_string('283F50');styles[name].paragraph_format.keep_with_next=True
    footer=s.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=footer.add_run();r.font.size=Pt(8);fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');r._r.addnext(fld)
    
    for border in list(d.styles.element.iter(qn('w:pBdr'))):border.getparent().remove(border)
    d.core_properties.title=title;d.core_properties.author='HAEDONG';d.core_properties.subject='Historical game branch B · creative edition'
    return d

def para(d,text):
    p=d.add_paragraph(text);return p

def image(d,path,caption,pocket=False,max_height=None,page_break=False):
    if not path.exists():raise FileNotFoundError(path)
    from PIL import Image
    with Image.open(path) as im:w,h=im.size
    maxw=92 if pocket else 165;maxh=max_height or (120 if pocket else 140)
    width=min(maxw,maxh*w/h)
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.page_break_before=page_break
    p.paragraph_format.keep_with_next=True
    p.paragraph_format.line_spacing=1.0
    p.paragraph_format.space_before=Pt(0)
    p.paragraph_format.space_after=Pt(5)
    run=p.add_run();pic=run.add_picture(str(path),width=Mm(width))
    docpr=pic._inline.docPr;docpr.set('descr',caption)
    c=d.add_paragraph(caption,'Caption');c.alignment=WD_ALIGN_PARAGRAPH.CENTER;c.paragraph_format.keep_with_next=False

# Novel: continuous prose, chapter breaks, 20 separate original plates.
txt=(R/'01_Novel/haedong_novel.md').read_text();parts=re.split(r'^## ',txt,flags=re.M)
chapters=parts[2:]
d=setup('해동연의 제1권 안시성의 불멸',True)
d.add_paragraph('海東演義', 'Title');d.add_paragraph('해동연의\n제1권 · 안시성의 불멸','Subtitle')
para(d,'HAEDONG v1.0\n삽화 수록 소형 판형 완결본')
image(d,R/'03_Characters/portrait_yang_manchun.png','양만춘 · 작품용 외형',True,55)
d.add_heading('일러두기',1).paragraph_format.page_break_before=True
para(d,'645년 안시성의 역사 골격 위에 게임 분기 B를 소설화했다. 상대 일차는 역사 달력과 다르다. 양만춘은 전승명이며 고연수의 배역은 대체역사다. 대사·심리·인물 외형·생활 장면은 창작이다. 사건별 출처와 미확인은 별도 시나리오북에 정리했다.')
para(d,'삽화는 작품용 창작 이미지이며 실제 인물 초상이나 고증 완료 복원도가 아니다. 본문은 서장·29장·종장으로 완결된다.')
d.add_heading('차례',1).paragraph_format.page_break_before=True
for part in chapters:para(d,part.split('\n',1)[0])
scene_files=sorted((R/'04_Illustrations').glob('scene_*.png'))
# place 20 images at matching chapter endings; indices include prologue0.
scene_chapters=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,20,26,29]
scene_captions=['반쯤 오른 흙산','성문을 나서는 기동대','늦게 온 전령','협곡 북쪽 정찰','첫 방어선의 틈','구원군 선발대 합류','양덕의 야간 기습','오골성 군량수레','치료소의 이름표','토산 붕괴','새벽의 반격','토산 점령','외곽 공성진지','휴전 사절','포로의 물그릇','황제의 철군 판단','물러가는 깃발','두 명부','양덕의 출발','겨울의 안시성']
for idx,part in enumerate(chapters):
    title,body=part.split('\n',1);d.add_heading(title,1).paragraph_format.page_break_before=True
    for block in body.strip().split('\n\n'):para(d,block.replace('\n',' '))
    if idx in scene_chapters:
        j=scene_chapters.index(idx)
        if j<len(scene_files):image(d,scene_files[j],scene_captions[j]+' · 창작 삽화',True,page_break=True)
d.save(R/'01_Novel/haedong_novel.docx')

# Markdown compiler with real tables and embedded images.
def md_doc(src,out,title):
    dd=setup(title);lines=src.splitlines();i=0
    while i<len(lines):
        l=lines[i].strip()
        if not l:i+=1;continue
        if l.startswith('```'):
            i+=1;buf=[]
            while i<len(lines) and not lines[i].startswith('```'):buf.append(lines[i]);i+=1
            for ln in buf:
                pp=dd.add_paragraph(ln);pp.paragraph_format.line_spacing=Pt(11)
                for rr in pp.runs:rr.font.name='DejaVu Sans Mono';rr.font.size=Pt(8)
        elif l.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=[x.strip() for x in lines[i].strip().strip('|').split('|')]
                if not all(set(x)<=set('-: ') for x in row):rows.append(row)
                i+=1
            if rows:
                tb=dd.add_table(rows=1,cols=len(rows[0]));tb.style='Light Shading Accent 1'
                for c,v in zip(tb.rows[0].cells,rows[0]):c.text=v
                trpr=tb.rows[0]._tr.get_or_add_trPr();repeat=OxmlElement('w:tblHeader');trpr.append(repeat)
                for row in rows[1:]:
                    cells=tb.add_row().cells
                    for c,v in zip(cells,row):c.text=v
                for row in tb.rows:
                    for c in row.cells:
                        for p in c.paragraphs:
                            for r in p.runs:r.font.size=Pt(8)
            continue
        elif l.startswith('#'):
            level=len(l)-len(l.lstrip('#'));heading=l[level:].strip();hh=dd.add_heading(heading,min(level,3))
            if level==2 and title.startswith('인물'):hh.paragraph_format.page_break_before=True
            if level==3 and title.startswith('시나리오') and heading in {x['title'] for x in read('maps.json')}:hh.paragraph_format.page_break_before=True
        elif l.startswith('!['):
            m=re.match(r'!\[(.*?)\]\((.*?)\)',l)
            dd.paragraphs[-1].paragraph_format.keep_with_next=True
            image(dd,(out.parent/m[2]).resolve(),m[1]+' · 작품용 창작 이미지')
        else:para(dd,l.replace('**','').replace('`',''))
        i+=1
    dd.save(out)
md_doc(sc,R/'02_Scenario/scenario_book.docx','시나리오북 · 안시성의 불멸')
md_doc((R/'03_Characters/CHARACTER_BIBLE.md').read_text(),R/'03_Characters/character_bible.docx','인물 설정집 · 안시성의 불멸')
md_doc((R/'06_Codex/GAME_DESIGN.md').read_text(),R/'06_Codex/game_design.docx','해동삼국지 게임 개발 명세')
print('compiled all books; chapter count',len(chapters),'scene plates',len(scene_files))
