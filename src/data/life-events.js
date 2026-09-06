// 跨行程事件；actionIds 限制工作脈絡，避免街頭演出接到殺青劇情。
export const LIFE_EVENTS={
  "train": [
    {
      "id": "train_observer",
      "title": "教室後排的陌生訪客",
      "text": "今天有人帶著平板坐在教室後排，老師介紹是來瞭解課程的業界製作。練習照常，他偶爾抬頭，有時只低頭記字。那道視線讓你忍不住想表現得比平常更好。",
      "kind": "職涯事件",
      "choices": [
        {
          "id": "stay",
          "label": "照原本練習完成",
          "outcome": "你把注意力放回剛才要修的地方。結束時才發現，自己沒有一直確認對方在看誰。",
          "effect": {
            "hidden": "抗壓",
            "value": 2
          }
        },
        {
          "id": "show",
          "label": "自願多示範一段",
          "outcome": "你舉手完成額外示範，製作端把你的配合度記進觀察；離開教室時，疲倦也比預計多了一點。",
          "effect": {
            "rep": "業界評價",
            "value": 2,
            "fatigue": 3
          }
        }
      ]
    },
    {
      "id": "train_bad_day",
      "title": "今天卡在同一個地方",
      "text": "同一個練習反覆重來，問題卻沒有跟次數一起減少。老師請你先停下，說今天剩下的時間可以只處理一個小地方，也可以整理問題後收工。",
      "choices": [
        {
          "id": "push",
          "label": "縮小範圍，再試一次",
          "outcome": "你只抓一個停頓慢慢修，終於做出比前面清楚的版本；額外花掉的精神，也實實在在留在身上。",
          "effect": {
            "hidden": "自律",
            "value": 2,
            "fatigue": 4
          }
        },
        {
          "id": "stop",
          "label": "記下問題，今天先休息",
          "outcome": "你把卡住的位置寫清楚，不讓下次又從懊惱開始。走出教室時，至少不用再逼身體證明自己有多想成功。",
          "effect": {
            "health": 2,
            "fatigue": -4
          }
        }
      ]
    },
    {
      "id": "train_peer",
      "title": "別人的進度忽然往前",
      "text": "一位常見的同學今天展示成果，比先前流暢許多。你低頭看自己的筆記，明明也練了不少，卻忍不住把差距算得比進步更仔細。",
      "choices": [
        {
          "id": "ask",
          "label": "問他最近怎麼練",
          "outcome": "對方拿出把大段拆小的紀錄，連沒練成的部分都還留著。你帶回能試的方法，也少了一個「他天生就會」的猜測。",
          "effects": [
            {
              "stat": "學識",
              "value": 3
            },
            {
              "hidden": "自律",
              "value": 1
            }
          ]
        },
        {
          "id": "compete",
          "label": "加練一次成果展示",
          "outcome": "你在原課程外多練站姿、動作與呈現的節奏，確實更熟了；收拾時才發現，今天留給休息的時間又被擠掉。",
          "effect": {
            "stat": "肢體表現",
            "value": 3,
            "fatigue": 5
          }
        }
      ]
    },
    {
      "id": "train_teacher_note",
      "title": "老師重播了那一段",
      "text": "課後老師把練習紀錄停在一個細節。你原本覺得那裡已經過關，老師卻問：「這次做得到，下一次能不能知道自己怎麼做到？」",
      "choices": [
        {
          "id": "listen",
          "label": "把觀察完整聽完",
          "outcome": "你沒有急著替結果解釋。老師把問題拆得很具體，也在對你的評語裡多寫了「能接受調整」。",
          "effects": [
            {
              "rep": "業界評價",
              "value": 2
            },
            {
              "hidden": "抗壓",
              "value": 2
            }
          ]
        },
        {
          "id": "question",
          "label": "請老師示範可重複的練法",
          "outcome": "你把方法記成短步驟，先確認一個地方，再逐次增加內容；下一堂要做什麼，終於不只剩更努力。",
          "effect": {
            "hidden": "自律",
            "value": 2
          }
        }
      ]
    },
    {
      "id": "train_injury_scare",
      "title": "差一點踩空",
      "text": "離開教室時，你在樓梯邊踩空半步，扶住欄桿才站穩。腳踝有點不舒服，原本打算留下的額外練習需要重新考慮。",
      "choices": [
        {
          "id": "ice",
          "label": "取消加練，先休息觀察",
          "outcome": "你停止額外活動，請現場人員協助確認需要的處理，讓今天先到這裡。少做一點，仍是認真對待往後的行程。",
          "effect": {
            "health": 3,
            "fatigue": -2
          }
        },
        {
          "id": "continue",
          "label": "留在座位整理課程筆記",
          "outcome": "你沒有再做站立練習，改坐著整理所學；等離開時，那點不舒服仍提醒你今天留得有些久。",
          "effect": {
            "hidden": "自律",
            "value": 1,
            "health": -1
          }
        }
      ]
    },
    {
      "id": "train_recording",
      "title": "練習鏡頭輪到你",
      "text": "助教先徵求同意，想把每人的成果展示錄作課堂回看。你原本很熟的開頭，在鏡頭亮起時卻忽然陌生起來。",
      "choices": [
        {
          "id": "normal",
          "label": "先完成這一遍",
          "outcome": "你承認自己緊張，仍把展示說清楚。回看時，真正在意內容的眼神，比刻意準備的表情更自然。",
          "effect": {
            "stat": "鏡頭感",
            "value": 2
          }
        },
        {
          "id": "perfect",
          "label": "完成後再錄一遍",
          "outcome": "第二遍你調整視線與停頓，畫面確實完整些；多投入的心力，也得靠稍後的休息補回來。",
          "effect": {
            "stat": "鏡頭感",
            "value": 3,
            "fatigue": 2
          }
        }
      ]
    },
    {
      "id": "train_old_clip",
      "title": "同一堂課的兩個版本",
      "text": "你把課前試錄和課後展示接著播放。原先只覺得今天還是不夠好，並排一看，卻有幾個地方已經不一樣。",
      "choices": [
        {
          "id": "compare",
          "label": "標出具體進步",
          "outcome": "你寫下現在能穩定完成的部分，再標記仍要練的地方。不是忽然變成高手，而是知道這堂課沒有白上。",
          "effect": {
            "mood": 4,
            "hidden": "自律",
            "value": 1
          }
        },
        {
          "id": "delete",
          "label": "把早上的版本收進私人資料夾",
          "outcome": "你替資料夾取了個只有自己看得懂的名字，忍不住笑了；還不想給人看，也可以先留給以後的自己。",
          "effect": {
            "mood": 2
          }
        }
      ]
    },
    {
      "id": "train_invite",
      "title": "高階成果交流的空位",
      "text": "隔壁班的成果交流有空位，老師問你要不要參與。內容超出目前熟悉的範圍，但允許自願展示，也可以只旁聽提問。",
      "kind": "職涯事件",
      "choices": [
        {
          "id": "join",
          "label": "報名一段現場展示",
          "outcome": "你把能完成的部分準備清楚，再接受現場追問。表現仍有生澀，老師卻記下你願意溝通與調整的態度；這一場也格外耗神。",
          "effect": {
            "rep": "業界評價",
            "value": 3,
            "fatigue": 4
          }
        },
        {
          "id": "watch",
          "label": "先看別人怎麼處理問題",
          "outcome": "你注意到對方不是每次都立刻回答，而是先確認題目。帶回筆記時，眼前更高的要求有了可理解的輪廓。",
          "effect": {
            "hidden": "洞察",
            "value": 2
          }
        }
      ]
    }
  ],
  "job": [
    {
      "id": "job_delay",
      "title": "流程臨時往後延",
      "text": "現場宣佈一個環節需要重整，接下來的時段暫時空下來。工作人員有人整理資料，有人坐著閉眼；重新集合的通知還沒到。",
      "choices": [
        {
          "id": "network",
          "label": "和同樣在等的人聊聊",
          "outcome": "你先看對方有沒有在忙，再聊起今天的分工。名字終於和工作連起來，下一次詢問也知道該找誰。",
          "effect": {
            "stat": "社交",
            "value": 2
          }
        },
        {
          "id": "rest",
          "label": "確認通知方式，補一點精神",
          "outcome": "你把重開提醒設好，找不擋路的位置休息。短短一段空檔，讓重新開始時的腦袋沒那麼鈍。",
          "effect": {
            "fatigue": -3
          }
        }
      ],
      "actionIds": [
        "job_session",
        "tv_assistant",
        "film_runner",
        "record_archive",
        "media_runner",
        "newcomer_gig",
        "relief_gig"
      ]
    },
    {
      "id": "job_praise",
      "title": "收工前的一句詢問",
      "text": "現場窗口在交接後請你留步，問往後如何聯絡比較方便。你說明自己的回覆方式，沒有把尚未確認的時段說成隨時有空。對方把資料存好，說今天合作的節奏很清楚。",
      "kind": "職涯事件",
      "effect": {
        "rep": "業界評價",
        "value": 3
      },
      "actionIds": [
        "job_session",
        "tv_assistant",
        "film_runner",
        "record_archive",
        "media_runner",
        "newcomer_gig",
        "relief_gig"
      ]
    },
    {
      "id": "job_rewrite",
      "title": "執行前又來一版",
      "text": "正式工作的內容剛要執行，窗口又送來修訂稿，連最後一句都換了。頁面上的標註很醒目，修改的原因卻還沒人完整說明。",
      "choices": [
        {
          "id": "memorize",
          "label": "先確認字句與順序",
          "outcome": "你圈出變動處，向窗口讀回一遍再開始。舊稿沒有自動搶回嘴巴，執行也沒有卡在版本差異。",
          "effect": {
            "hidden": "抗壓",
            "value": 2
          }
        },
        {
          "id": "ask",
          "label": "先問這次想改變什麼",
          "outcome": "你問清要更輕鬆還是更克制，再調整呈現。窗口發現你理解的不只是文字，下一次說明也更願意多講一步。",
          "effects": [
            {
              "hidden": "洞察",
              "value": 2
            },
            {
              "rep": "業界評價",
              "value": 1
            }
          ]
        }
      ],
      "actionIds": [
        "job_session"
      ]
    },
    {
      "id": "job_coactor",
      "title": "搭檔一直卡住",
      "text": "正式工作的排練連著停了幾次，合作對象越急，越容易在同一處出錯。稍後還有你們要一起完成的段落，剩下的準備時間不多。",
      "choices": [
        {
          "id": "support",
          "label": "問對方哪裡最難接",
          "outcome": "你們把銜接點拆開再過一次。對方不再急著證明沒事，你也更知道該在哪裡留反應的時間。",
          "effect": {
            "hidden": "共情",
            "value": 2
          }
        },
        {
          "id": "focus",
          "label": "把自己的節點先準備好",
          "outcome": "你重新確認進出與內容，讓對方至少能得到穩定的回應；沒有解決全部問題，也沒有被焦躁一起帶走。",
          "effect": {
            "hidden": "抗壓",
            "value": 2
          }
        }
      ],
      "actionIds": [
        "job_session"
      ]
    },
    {
      "id": "job_staff",
      "title": "有人先叫出你的名字",
      "text": "到現場時，窗口看著事先準備的資料喊出你的名字，接著告訴你物品可以放在哪裡。你回應後也記下對方稱呼，今天不必只靠「那個誰」彼此尋找。",
      "kind": "職涯事件",
      "effect": {
        "rep": "業界評價",
        "value": 2,
        "mood": 3
      },
      "actionIds": [
        "job_session",
        "tv_assistant",
        "film_runner",
        "record_archive",
        "media_runner",
        "newcomer_gig",
        "relief_gig"
      ]
    },
    {
      "id": "job_extra_take",
      "title": "還能再試一種版本",
      "text": "正式工作的原定內容已完成，負責人確認仍在原約定範圍與時段內，問你願不願意多試一版。這次想要的情緒，和剛才幾乎相反。",
      "choices": [
        {
          "id": "try",
          "label": "試試新的詮釋",
          "outcome": "你先確認改變的重點再完成，製作端把這版留作選擇；多花的精神，換到一次能夠比較兩種做法的機會。",
          "effect": {
            "rep": "業界評價",
            "value": 3,
            "fatigue": 2
          }
        },
        {
          "id": "safe",
          "label": "保留原版，先做好交接",
          "outcome": "你說明希望維持目前穩定的成果，再把既定工作收完整。沒有多出新版本，交付也沒有留下待補的空白。",
          "effect": {
            "hidden": "自律",
            "value": 1
          }
        }
      ],
      "actionIds": [
        "job_session"
      ]
    },
    {
      "id": "job_interview",
      "title": "臨時多了一段工作短訪",
      "text": "正式工作結束，宣傳窗口詢問能否錄兩分鐘心得，說明會用在已核可的花絮。題目很簡單：今天哪個部分最值得記住？",
      "choices": [
        {
          "id": "accept",
          "label": "就從剛才的一件事說起",
          "outcome": "你用一個具體片段說明團隊怎麼完成工作，短訪剪進花絮後，觀眾也開始討論那個幕後細節。",
          "effects": [
            {
              "stat": "口才",
              "value": 2
            },
            {
              "rep": "話題度",
              "value": 2
            }
          ]
        },
        {
          "id": "prepare",
          "label": "請給我三分鐘整理",
          "outcome": "你先確認可公開的內容，再整理成清楚的回答。沒有添油加醋，也讓宣傳窗口省下反覆核對的時間。",
          "effect": {
            "rep": "可信度",
            "value": 2
          }
        }
      ],
      "actionIds": [
        "job_session"
      ]
    },
    {
      "id": "job_wrap_gift",
      "title": "收工卡上的名字",
      "text": "今天的工作告一段落，有人拿來一張讓團隊留言的小卡。上面有很工整的字，也有趕時間寫得像心電圖的簽名。",
      "kind": "人物事件",
      "choices": [
        {
          "id": "keep",
          "label": "把它和工作紀錄收好",
          "outcome": "你先記下每個名字對應的分工，再把卡放進資料袋。成果還在後續流程裡，今天一起完成的部分卻有了小小紀念。",
          "effect": {
            "mood": 6
          }
        },
        {
          "id": "post",
          "label": "確認後分享不含資訊的一角",
          "outcome": "得到同意後，你只拍卡片邊角與自己的手，沒有露出簽名和未公開內容。幾則留言問起幕後，你回了一句謝謝。",
          "effect": {
            "fans": 8,
            "rep": "話題度",
            "value": 1,
            "mood": 4
          }
        }
      ],
      "actionIds": [
        "job_session"
      ]
    }
  ],
  "life": [
    {
      "id": "daily_recognized",
      "title": "便利商店裡的試探",
      "text": "便利商店排隊時，後面的人小聲問：「是不是那個有表演影片的……？」你手裡還拿著今天的晚餐，輪到結帳只剩一位。",
      "kind": "輿論事件",
      "requires": {
        "fameMin": 10
      },
      "choices": [
        {
          "id": "smile",
          "label": "結完帳後打個招呼",
          "outcome": "你移到不擋路的位置回應，對方高興得連稱呼都卡了一下。短短的交流，讓幾位原本路過的人也記住了你。",
          "effect": {
            "fans": 6,
            "rep": "路人緣",
            "value": 2
          }
        },
        {
          "id": "quiet",
          "label": "今天先安靜離開",
          "outcome": "你照常結帳，把晚餐帶回去。沒有每次都回應，不等於剛才那份熱情沒有收到。",
          "effect": {
            "mood": 2
          }
        }
      ]
    },
    {
      "id": "daily_old_friend",
      "title": "一則不問成績的訊息",
      "text": "很久沒聊的朋友傳來附近新開的小店照片，接著問你最近是不是很忙。訊息沒有附帶工作請求，也沒有問什麼時候會紅。",
      "choices": [
        {
          "id": "reply",
          "label": "慢慢回一段近況",
          "outcome": "你們從那家店聊到以前吃過的難吃便當，不知不覺笑了幾次。今晚終於有人不是透過成績單認識你。",
          "effect": {
            "mood": 5,
            "fatigue": -2
          }
        },
        {
          "id": "later",
          "label": "先留下提醒，晚點再回",
          "outcome": "你把訊息標記好，卻還是沒能當下接住話題。通知安靜下來，心裡留著一件小小未完成。",
          "effect": {
            "mood": -1
          }
        }
      ]
    },
    {
      "id": "daily_rain",
      "title": "被雨留下的十分鐘",
      "text": "你沒帶傘，只能暫時站在屋簷下。雨點把對街的招牌切得模糊，旁邊的人正把紙袋往衣服裡藏。",
      "choices": [
        {
          "id": "wait",
          "label": "等雨小一點",
          "outcome": "你替後來的人挪了點位置，聽雨聲蓋過通知。今天罕見地不需要立刻做決定。",
          "effect": {
            "fatigue": -3,
            "mood": 3
          }
        },
        {
          "id": "run",
          "label": "趁雨稍緩快步回去",
          "outcome": "你沿遮蔽物往回走，最後一段仍被淋濕。回到乾處有點狼狽，心情卻意外鬆了，身體也需要照顧一下。",
          "effect": {
            "mood": 4,
            "health": -1
          }
        }
      ]
    },
    {
      "id": "daily_comment",
      "title": "收藏夾多了一句話",
      "text": "一則留言說，對方某天很累，原本只想滑過去，卻把你的表演聽完了。沒有說你多厲害，只說那幾分鐘讓晚餐沒那麼難吃下去。",
      "kind": "輿論事件",
      "requires": {
        "fansMin": 100
      },
      "choices": [
        {
          "id": "save",
          "label": "把留言存起來",
          "outcome": "你把日期一並記下。對方願意認真說出感受，你也把它當成值得保留的回饋，而不只是另一個讚數。",
          "effect": {
            "mood": 7,
            "rep": "可信度",
            "value": 2
          }
        },
        {
          "id": "reply",
          "label": "回一句具體的謝謝",
          "outcome": "你謝謝對方把那個晚上告訴你。回應讓更多人注意到這段交流，留言區也多了幾個自己的小故事。",
          "effect": {
            "fans": 10,
            "rep": "路人緣",
            "value": 2
          }
        }
      ]
    },
    {
      "id": "daily_gossip",
      "title": "隔壁桌的加長版八卦",
      "text": "隔壁桌把一則娛樂新聞越聊越精彩，連原報道沒有的對話都編了出來。你對其中某些細節存疑，卻也不掌握完整經過。",
      "choices": [
        {
          "id": "listen",
          "label": "聽聽說法怎麼變形",
          "outcome": "你分辨哪些來自報道、哪些只是推測；同一條消息經過幾個人，居然長出了另一部劇。",
          "effect": {
            "hidden": "洞察",
            "value": 2
          }
        },
        {
          "id": "leave",
          "label": "換個位置，繼續自己的事",
          "outcome": "你沒有加入也沒有爭辯。今天的心情不用跟著一桌人的猜測一起上下班。",
          "effect": {
            "mood": 2
          }
        }
      ]
    },
    {
      "id": "daily_street_photo",
      "title": "宵夜袋比造型更搶鏡",
      "text": "有人把你買完宵夜的街拍傳上網，最醒目的不是臉，而是手上鼓鼓的一袋食物。照片沒有暴露住處，底下已有人開始猜菜單。",
      "kind": "輿論事件",
      "requires": {
        "fameMin": 40
      },
      "choices": [
        {
          "id": "laugh",
          "label": "用一句玩笑回應",
          "outcome": "你只說那是今天認真挑選的晚餐，沒有補上地點。路人跟著聊起宵夜，氣氛比預想輕鬆。",
          "effect": {
            "rep": "路人緣",
            "value": 3,
            "rep2": "話題度"
          }
        },
        {
          "id": "ignore",
          "label": "繼續吃，不特別處理",
          "outcome": "你把手機放下，趁東西還熱先吃完。沒接的話題慢慢往下沈，晚餐終於不用陪新聞加班。",
          "effect": {
            "mood": 1
          }
        }
      ]
    },
    {
      "id": "daily_invitation",
      "title": "一封可以不去的邀請",
      "text": "業界交流活動寄來邀請，時間剛好落在可安排的晚間。信裡說明是自由出席，沒有指定工作，也不要求帶著漂亮成績才能進門。",
      "kind": "職涯事件",
      "requires": {
        "fameMin": 60
      },
      "choices": [
        {
          "id": "go",
          "label": "去認識幾位同行",
          "outcome": "你挑幾位有共同話題的人聊，交換具體的工作方向。走出門時有點累，聯絡簿卻多了幾個能對上話的人。",
          "effects": [
            {
              "stat": "社交",
              "value": 2
            },
            {
              "rep": "業界評價",
              "value": 2
            },
            {
              "fatigue": 2
            }
          ]
        },
        {
          "id": "home",
          "label": "把晚上留給自己",
          "outcome": "你禮貌回覆不出席，替這一晚做了簡單的飯和安靜的安排；不是每一個空格都要填成機會。",
          "effect": {
            "mood": 4,
            "fatigue": -3
          }
        }
      ]
    },
    {
      "id": "daily_break",
      "title": "手機暫時離線",
      "text": "手機沒電時，你才發現行動電源也空了。今天暫時沒有待確認的集合，但平常不停刷新的通知忽然全部停住。",
      "choices": [
        {
          "id": "enjoy",
          "label": "先享受這段安靜",
          "outcome": "你把手機收好，留意起身邊正在發生的事。兩小時後重新連線，事情能逐件處理，肩膀也沒有原先那麼緊。",
          "effect": {
            "fatigue": -4,
            "mood": 5
          }
        },
        {
          "id": "borrow",
          "label": "找個地方詢問充電",
          "outcome": "你向店家問清插座與使用方式，終於借到短暫的電力。找人說明需求，也算一次很實際的開口練習。",
          "effect": {
            "stat": "社交",
            "value": 1
          }
        }
      ]
    }
  ]
};
