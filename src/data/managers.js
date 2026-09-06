export const MANAGERS={
  "starlight": {
    "id": "mgr-starlight",
    "agencyId": "starlight",
    "name": "許芮安",
    "title": "新人組經紀人",
    "personality": "冷靜務實",
    "workingStyle": "先把一週排得能完成，再討論下一次曝光；核對工作、交通與休息，不讓漂亮的行程表比本人先跑到終點。",
    "description": "許芮安說話像拿尺量過，問近況時常先問你上一餐何時吃。她會把新人能負擔的準備拆成小步驟，也會直接指出漏回的訊息與不切實際的安排。你開始穩定履約後，她才逐漸把更難的機會放上桌；誇人通常只有一句：「這次不用我追。」",
    "strengths": [
      "危機處理",
      "商務談判",
      "行程管理"
    ],
    "support": {
      "offerRange": [
        2,
        4
      ],
      "offerExpiryWeeks": 1,
      "auditionPrepBonus": 4
    },
    "initialTrust": 52,
    "initialStress": 18
  },
  "mirror": {
    "id": "mgr-mirror",
    "agencyId": "mirror",
    "name": "沈靜禾",
    "title": "演員部資深經紀人",
    "personality": "寡言精準",
    "workingStyle": "先看角色要做什麼、製作端怎麼完成，再判斷這份工作能累積哪種能力；不拿名字好聽當成接案理由。",
    "description": "沈靜禾談劇本時會翻回前一場，問你角色為什麼此刻要留下。她不太會說場面上的鼓勵，卻肯花時間替你拆清楚一場難戲，也願意查完製作與合作風險再談下一步。你把問題問得具體，她就把答案給得具體；桌上的沈默通常是在讀，不是在否定你。",
    "strengths": [
      "劇本判讀",
      "角色規劃",
      "製作風險"
    ],
    "support": {
      "offerRange": [
        1,
        3
      ],
      "offerExpiryWeeks": 2,
      "auditionPrepBonus": 6
    },
    "initialTrust": 46,
    "initialStress": 14
  },
  "clearvoice": {
    "id": "mgr-clearvoice",
    "agencyId": "clearvoice",
    "name": "韓知勳",
    "title": "音樂事業部經紀人",
    "personality": "強勢高效",
    "workingStyle": "把練習成果、舞台準備與宣傳時段對在一起；機會來時要能拿出版本，熱度之後也得有能留下的內容。",
    "description": "韓知勳的手機很少安靜，回訊息卻分得出哪件事先處理。他要求你說清練到哪裡、還差哪裡，不接受一句「差不多」就結束回報。趕流程時很有壓迫感，但你指出尚未準備好的部分，他會重新評估安排；他的期待不是你永遠不失誤，而是下一次知道怎麼修。",
    "strengths": [
      "宣傳節奏",
      "舞台資源",
      "品牌合作"
    ],
    "support": {
      "offerRange": [
        3,
        4
      ],
      "offerExpiryWeeks": 1,
      "auditionPrepBonus": 5
    },
    "initialTrust": 44,
    "initialStress": 24
  },
  "tide": {
    "id": "mgr-tide",
    "agencyId": "tide",
    "name": "羅沐晴",
    "title": "內容與藝人統籌",
    "personality": "靈活外向",
    "workingStyle": "先從本人已有的特色做一個能測試的版本，再看觀眾反應決定怎麼延伸；有趣需要原因，話題也得有人收尾。",
    "description": "羅沐晴常邊吃宵夜邊想企劃，聽你說完一件糗事，已經想到三種開場。她會追問你真正覺得好笑的地方，也會在發布前確認哪些事情適合公開。點子很快，工作不能只靠她快；當你能接著提出做法，她看你的眼神就像發現有人終於接到第四個球。",
    "strengths": [
      "綜藝企劃",
      "社群經營",
      "臨場救火"
    ],
    "support": {
      "offerRange": [
        2,
        4
      ],
      "offerExpiryWeeks": 1,
      "auditionPrepBonus": 5
    },
    "initialTrust": 50,
    "initialStress": 20
  }
};
export const managerForAgency=id=>MANAGERS[id]||null;
