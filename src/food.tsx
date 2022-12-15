import { request } from "undici";
import { Action, ActionPanel, Detail, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";

interface Preferences {
  schoolCode: string;
  atptOfcdcScCode: string;
}

export default function Command() {
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [school, setSchool] = useState<string>()
  const [listFood, setListFood] = useState<string[]>()
  const [listCalorie, setListCalorie] = useState<string[]>()

  const navigationTitle = date.toLocaleDateString("ko-KR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " 급식"

  async function fetchFood () {
    try {
      setIsLoading(true)
      const { schoolCode, atptOfcdcScCode } = await getPreferenceValues<Preferences>()
      const yyyymmdd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, "0") + date.getDate().toString().padStart(2, "0")
      const response = await request(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${atptOfcdcScCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${yyyymmdd}&type=json`)
      const { body } = response
      const data = await body.json()

      const food = data.mealServiceDietInfo[1].row.map((item: any) => {
        return "# " + item.MMEAL_SC_NM + "\n" + item.DDISH_NM.replace(/<br\/>/g, "\n\n")
      })
      setSchool(data.mealServiceDietInfo[1].row[0].SCHUL_NM)
      setListCalorie(data.mealServiceDietInfo[1].row.map((item: any) => { return item.CAL_INFO }))
      setListFood(food)
      setIsLoading(false)
    } catch (error) {
      setSchool("학교 정보를 불러오는데 실패했습니다.")
      setListCalorie([])
      setListFood(["급식 정보가 없습니다."])
      setIsLoading(false)
    }
  }

  function nextDay () {
    date.setDate(date.getDate() + 1)
    setDate(date)
    fetchFood()
  }

  function prevDay () {
    date.setDate(date.getDate() - 1)
    setDate(date)
    fetchFood()
  }

  function today () {
    date.setDate(new Date().getDate())
    setDate(new Date())
    fetchFood()
  }
  
  useEffect(() => {
    fetchFood()
  }, [])

  return <Detail 
    isLoading={isLoading}
    navigationTitle={navigationTitle}
    markdown={listFood?.join("\n")}
    metadata={
      <Detail.Metadata>
        <Detail.Metadata.Label
          title="학교"
          text={school}
        />
        <Detail.Metadata.Label
          title="일자"
          text={
            date.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long"
            })
            + (date.toLocaleDateString() === new Date().toLocaleDateString() ? " (오늘)" : "")
          }
        />
        <Detail.Metadata.Label
          title="칼로리"
          text={listCalorie ? listCalorie.join(", ") : "정보 없음"}
        />
      </Detail.Metadata>
    }
    actions={
      <ActionPanel>
        <ActionPanel.Section>
          <Action 
            title="Today"
            onAction={today}
          />
          <Action
            title="Prev Day"
            onAction={prevDay}
            shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
          />
          <Action
            title="Next Day"
            onAction={nextDay}
            shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
          />
        </ActionPanel.Section>
      </ActionPanel>
    }
  />;
}
