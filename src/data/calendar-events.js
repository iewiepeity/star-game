// 固定年度節點；活動曝光不等同正式接案、入圍或得獎。
export const CALENDAR_EVENTS=[
  {
    "id": "annual_goal",
    "weekInYear": 1,
    "repeat": "yearly",
    "title": "今年想把哪件事做好",
    "text": "新年度的行事曆翻到第一頁。你把要付的帳單、想學的內容和仍想完成的事放在一起看，決定替今年挑一個主方向；它不會替你排行程，但能提醒你為何選這一格。",
    "kind": "職涯事件",
    "choices": [
      {
        "id": "work",
        "label": "今年留下能介紹自己的作品",
        "outcome": "你寫下想讓人記得的一種表現，留一欄日後對照。目標終於不只有「變厲害」，而有了可以慢慢靠近的樣子。",
        "effect": {
          "flag": "年度目標：作品",
          "mood": 2
        }
      },
      {
        "id": "people",
        "label": "今年認真經營合作關係",
        "outcome": "你列出想學著做好的聯絡與回覆習慣。認識更多人之前，先讓每次合作都能接得下去。",
        "effect": {
          "flag": "年度目標：人脈",
          "mood": 2
        }
      },
      {
        "id": "health",
        "label": "今年替休息留出位置",
        "outcome": "你先做了幾次緩慢伸展，提醒自己別把所有空檔填滿。五年的路要走下去，也得讓身體願意一起來。",
        "effect": {
          "flag": "年度目標：健康",
          "health": 3
        }
      }
    ]
  },
  {
    "id": "spring_casting",
    "weekInYear": 7,
    "repeat": "yearly",
    "title": "春季徵選開案",
    "text": "春季第一批戲劇、廣告與音樂企劃陸續公開徵選。公告上的條件看似相近，實際要的聲音、角色與檔期卻不同，準備不能只用同一份資料寄到底。",
    "kind": "職涯事件",
    "choices": [
      {
        "id": "prepare",
        "label": "整理履歷與合適的示範",
        "outcome": "你把作品入口、可聯絡方式與強項排清楚。資料更容易判讀，也讓後續洽談有了具體的開始。",
        "effect": {
          "contract": 3,
          "rep": "業界評價",
          "value": 2
        }
      },
      {
        "id": "train",
        "label": "先找出能力缺口",
        "outcome": "你把目前達不到的要求另列一頁，挑出能練的部分。這批公告也能當教材，幫下一次準備找方向。",
        "effect": {
          "hidden": "自律",
          "value": 2
        }
      }
    ]
  },
  {
    "id": "fashion_week",
    "weekInYear": 11,
    "repeat": "yearly",
    "title": "星望春夏時尚週",
    "text": "商場與品牌活動換上春夏主視覺，公開場次的造型照一張接一張出現。你也收到活動資訊：可以挑一場適合的露面，不必為了每個鏡頭把一週全部塞滿。",
    "kind": "輿論事件",
    "requires": {
      "fameMin": 30
    },
    "choices": [
      {
        "id": "attend",
        "label": "挑一場符合風格的活動",
        "outcome": "你先確認活動主題，再完成一組有重點的造型照。討論開始注意搭配的細節，這次露面也讓你玩得開心。",
        "effect": {
          "rep": "時尚影響力",
          "value": 4,
          "rep2": "話題度",
          "mood": 2
        }
      },
      {
        "id": "skip",
        "label": "這次先留在原本節奏",
        "outcome": "你回覆不參與，少了妝髮、交通與等待的時間。空下的幾個小時，終於能把呼吸放慢。",
        "effect": {
          "fatigue": -3
        }
      }
    ]
  },
  {
    "id": "spring_festival",
    "weekInYear": 15,
    "repeat": "yearly",
    "title": "春季影視市場展",
    "text": "影視市場展的公開交流區擺滿企劃簡介，從故事一句話到預計製作規模，各組人都想把接下來的方向說清楚。這裡也容得下還在找自己位置的人。",
    "kind": "職涯事件",
    "choices": [
      {
        "id": "network",
        "label": "參加產業交流場",
        "outcome": "你先問對方正在找哪類合作，再介紹自己的方向。聊到同一個問題時，交換聯絡方式也自然了。",
        "effects": [
          {
            "stat": "社交",
            "value": 2
          },
          {
            "rep": "業界評價",
            "value": 2
          }
        ]
      },
      {
        "id": "observe",
        "label": "整理題材與製作趨勢",
        "outcome": "你把反覆出現的題材和不同做法列在一起，發現熱門不代表只有一種拍法，選案也多了比較依據。",
        "effect": {
          "hidden": "洞察",
          "value": 2
        }
      }
    ]
  },
  {
    "id": "music_award_week",
    "weekInYear": 20,
    "repeat": "yearly",
    "title": "星音年度音樂獎",
    "text": "音樂獎典禮週到了，入圍作品的配唱、編曲與現場表現都被重新討論。你參與過的歌曲也成為介紹經歷時能拿出的例子；有作品可談，和真正入圍仍是兩回事。",
    "kind": "職涯事件",
    "requires": {
      "completedCategory": "歌曲"
    },
    "effect": {
      "rep": "話題度",
      "value": 3
    }
  },
  {
    "id": "summer_campaign",
    "weekInYear": 24,
    "repeat": "yearly",
    "title": "夏季品牌合作季",
    "text": "飲料、運動與旅遊品牌開始安排暑期宣傳，合作資訊裡多了戶外、清爽與日常感。你能選擇更積極展示商務配合度，也能先整理適合自己的合作方向。",
    "kind": "職涯事件",
    "requires": {
      "fameMin": 20
    },
    "choices": [
      {
        "id": "commercial",
        "label": "讓品牌更清楚我能配合什麼",
        "outcome": "你把可呈現的風格與合作需求寫清楚，讓窗口比較容易評估。商業機會有了入口，正式工作仍要逐案確認。",
        "effect": {
          "rep": "商業價值",
          "value": 4
        }
      },
      {
        "id": "selective",
        "label": "先列出真正適合的產品方向",
        "outcome": "你把自己能誠實介紹的類型與需要再了解的項目分開。下一次談合作時，說法也更經得起追問。",
        "effect": {
          "rep": "可信度",
          "value": 3
        }
      }
    ]
  },
  {
    "id": "midyear_review",
    "weekInYear": 27,
    "repeat": "yearly",
    "title": "把半年攤開來看",
    "text": "上半年盤點開始出現在娛樂版面。你也翻開自己的紀錄：有的格子寫著成果，有的只留下練習與重來。和別人的榜單放在一起之前，先看清楚自己走了多少。",
    "kind": "輿論事件",
    "choices": [
      {
        "id": "proud",
        "label": "留下已經做好的部分",
        "outcome": "你把能穩定做到的事圈起來，連原本覺得太小的進步也沒有跳過。半年沒有忽然變成完美，卻並非空白。",
        "effect": {
          "mood": 5
        }
      },
      {
        "id": "adjust",
        "label": "挑出下半年最想改善的一件事",
        "outcome": "你沒有一次列十個目標，只選出會影響下一步的缺口。野心有了方向，練習也知道該往哪裡排。",
        "effect": {
          "hidden": "野心",
          "value": 2,
          "hidden2": "自律"
        }
      }
    ]
  },
  {
    "id": "summer_festival",
    "weekInYear": 31,
    "repeat": "yearly",
    "title": "盛夏戶外演出季",
    "text": "音樂祭與戶外節目陸續開跑，公開的舞台片段帶起一波演出討論，也有人回頭找你分享過的內容。你看著別人的彩排與正式版本，除了羨慕，也開始分得出那些熱鬧背後的準備。",
    "kind": "職涯事件",
    "requires": {
      "fameMin": 15
    },
    "effect": {
      "rep": "話題度",
      "value": 2,
      "mood": 2
    }
  },
  {
    "id": "autumn_casting",
    "weekInYear": 35,
    "repeat": "yearly",
    "title": "秋季重點檔期徵選",
    "text": "秋季製作案開始找人，有些為年末上檔，有些還在替明年籌備。公告上的時段密密麻麻，新的機會與原先的準備開始爭同一張行事曆。",
    "kind": "職涯事件",
    "choices": [
      {
        "id": "audition",
        "label": "整理條件，積極爭取合適的案子",
        "outcome": "你逐份核對需求、準備回覆資料，讓更多洽談有機會開始。還沒新增正式工作，光準備就先耗掉一些精神。",
        "effect": {
          "contract": 4,
          "fatigue": 2
        }
      },
      {
        "id": "pace",
        "label": "先把原先答應的事做好",
        "outcome": "你不把每封公告都當成不能錯過的末班車，回覆也說清楚自己的安排。別人至少知道，你答應的事會有下文。",
        "effect": {
          "rep": "可信度",
          "value": 2
        }
      }
    ]
  },
  {
    "id": "charity_week",
    "weekInYear": 38,
    "repeat": "yearly",
    "title": "公益活動的工作清單",
    "text": "一場公益活動公開邀請藝人參與，需求寫得很細：說明、引導、協助現場，也接受不出席的捐助。主辦方希望先讓大家了解服務內容，再決定怎麼參與。",
    "kind": "人物事件",
    "requires": {
      "fameMin": 40
    },
    "choices": [
      {
        "id": "join",
        "label": "參與現場活動",
        "outcome": "你把流程與服務對象的需求先看完，到場做完分配的工作。交流留下好印象，回程時記得最清楚的，卻是幾句很生活的道謝。",
        "effect": {
          "rep": "路人緣",
          "value": 4,
          "rep2": "可信度",
          "mood": 4
        }
      },
      {
        "id": "donate",
        "label": "捐助二千元，這次不出席",
        "outcome": "你核對主辦與用途後完成捐助，收好確認紀錄。沒有額外曝光，心裡仍知道自己參與了哪一件事。",
        "effect": {
          "money": -2000,
          "mood": 3
        }
      }
    ]
  },
  {
    "id": "screen_award_week",
    "weekInYear": 42,
    "repeat": "yearly",
    "title": "金幕／星河影視獎季",
    "text": "影視典禮週開始，娛樂版重新整理今年的表演與製作。你也更新手上的作品介紹，讓已完成的經驗在業界交流時更容易被理解；典禮有自己的名單，履歷也有自己的累積。",
    "kind": "職涯事件",
    "requires": {
      "completedWorksMin": 1
    },
    "effect": {
      "rep": "業界評價",
      "value": 3
    }
  },
  {
    "id": "year_end_party",
    "weekInYear": 44,
    "repeat": "yearly",
    "title": "年末交流與收工聚會",
    "text": "年末公開交流、品牌餐會與收工聚會陸續傳來消息。不是每場都非去不可，但願意到場時，除了介紹自己，也有機會聽聽別人的一年怎麼過。",
    "kind": "人物事件",
    "requires": {
      "fameMin": 25
    },
    "choices": [
      {
        "id": "show",
        "label": "挑一場去打招呼",
        "outcome": "你把幾個名字和工作記在一起，聊完再確認後續聯絡方式。回家時有點累，至少沒有只帶回一把對不上人的名片。",
        "effect": {
          "stat": "社交",
          "value": 2,
          "fatigue": 2
        }
      },
      {
        "id": "leave",
        "label": "露面致意後提早離開",
        "outcome": "你把道別說清楚，不拖到散場才匆忙叫車。早回來的時間，足夠讓晚餐與睡眠照原本的節奏走。",
        "effect": {
          "fatigue": -3,
          "health": 1
        }
      }
    ]
  },
  {
    "id": "variety_award_week",
    "weekInYear": 46,
    "repeat": "yearly",
    "title": "金笑綜藝獎",
    "text": "綜藝獎典禮週裡，笑點、主持節奏與外景片段被剪成一段段回顧。你參與過的節目成了觀眾找作品的線索；那幾次看似普通的接話，也有機會被更多人記住。",
    "kind": "職涯事件",
    "requires": {
      "completedCategory": "綜藝"
    },
    "effect": {
      "rep": "國民度",
      "value": 2
    }
  },
  {
    "id": "brand_award_week",
    "weekInYear": 48,
    "repeat": "yearly",
    "title": "年度品牌影響力獎",
    "text": "廣告圈開始盤點年度合作，討論不只看明星的臉，也看作品是否說清楚產品、是否讓人記得。你已完成的廣告經驗多了一次被商務端比較與評估的機會。",
    "kind": "職涯事件",
    "requires": {
      "completedCategory": "廣告"
    },
    "effect": {
      "rep": "商業價值",
      "value": 3
    }
  },
  {
    "id": "birthday",
    "dynamic": "birthday",
    "repeat": "yearly",
    "title": "生日，留給自己的一格",
    "text": "又到生日這一週。你翻看最近的行程，想找一小段不必向工作交代的時間。今年過得如何，可以先不用濃縮成一句成功或失敗。",
    "kind": "人物事件",
    "choices": [
      {
        "id": "quiet",
        "label": "留一個安靜的晚上",
        "outcome": "你挑了喜歡的食物，把通知暫時調低。今天先把自己照顧好，不急著替多長的一歲寫出漂亮結論。",
        "effect": {
          "mood": 8,
          "fatigue": -6
        }
      },
      {
        "id": "share",
        "label": "發一則生日近況",
        "outcome": "你分享一段平常的小事，再謝謝一路願意關注的人。祝福陸續出現，新來的人也跟著看了看你的頁面，這一天多了些熱鬧。",
        "effect": {
          "fans": 20,
          "fame": 2,
          "mood": 5
        }
      }
    ]
  },
  {
    "id": "year_end",
    "weekInYear": 52,
    "repeat": "yearly",
    "title": "今年沒有白走",
    "text": "年度榜單陸續公開，你把自己的紀錄也翻到末頁。有些答案還沒來，有些選擇已經改變生活；一年走完，值得整理的不限於有沒有登上版面。",
    "kind": "輿論事件",
    "choices": [
      {
        "id": "review",
        "label": "把得失與想保留的事記下",
        "outcome": "你寫下喜歡的工作方式、仍要練的部分，以及不想再忽略的人。這份紀錄先為你自己留下，不必像得獎感言。",
        "effect": {
          "mood": 4
        }
      },
      {
        "id": "forward",
        "label": "先寫下一個還想挑戰的目標",
        "outcome": "你把新的目標放在筆記末頁，沒有急著替現在下結論。往後怎麼走仍要準備，但想再試一次的心還在。",
        "effect": {
          "hidden": "野心",
          "value": 3
        }
      }
    ]
  }
];
