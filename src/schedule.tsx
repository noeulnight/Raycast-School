import { request } from "undici";
import { Action, ActionPanel, Detail, getPreferenceValues, ListItem } from "@raycast/api";
import { useEffect, useState } from "react";

interface Preferences {
  schoolCode: string;
  atptOfcdcScCode: string;
  apiKey: string;
  grade: string;
  class_nm: string;
  dddep: string;
}

export default function Command() {
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [school, setSchool] = useState<string>()
  const [listSchedule, setListSchedule] = useState<string[]>()
  const [preferences, setPreferences] = useState<Preferences>()

  const navigationTitle = date.toLocaleDateString("ko-KR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " 시간표"

  async function fetchSchedule () {
    try {
      setIsLoading(true)
      const { schoolCode, atptOfcdcScCode, apiKey, grade, class_nm, dddep } = await getPreferenceValues<Preferences>()
      const yyyymmdd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, "0") + date.getDate().toString().padStart(2, "0")
      const response = await request(`https://open.neis.go.kr/hub/hisTimetable?ATPT_OFCDC_SC_CODE=${atptOfcdcScCode}&SD_SCHUL_CODE=${schoolCode}&type=json&key=${apiKey}&grade=${grade}&class_nm=${class_nm}&ay=2022&ALL_TI_YMD=${yyyymmdd}${dddep ? "&DDDEP_NM=" + dddep : ""}`)
      const { body } = response
      const data = await body.json()

      const schedule = data.hisTimetable[1].row.sort().map((item: any) => {
        return "## **" + item.PERIO + "교시** " + item.ITRT_CNTNT + "\n"
      })
      
      setPreferences({ schoolCode, atptOfcdcScCode, apiKey, grade, class_nm, dddep })
      setSchool(data.hisTimetable[1].row[0].SCHUL_NM)
      setListSchedule(schedule)
      setIsLoading(false)
    } catch (error) {
      setPreferences(undefined)
      setSchool("학교 정보를 불러오는데 실패했습니다.")
      setListSchedule(["시간표 정보가 없습니다."])
      setIsLoading(false)
    }
  }

  function nextDay () {
    date.setDate(date.getDate() + 1)
    setDate(date)
    fetchSchedule()
  }

  function prevDay () {
    date.setDate(date.getDate() - 1)
    setDate(date)
    fetchSchedule()
  }

  function today () {
    date.setDate(new Date().getDate())
    setDate(new Date())
    fetchSchedule()
  }
  
  useEffect(() => {
    fetchSchedule()
  }, [])

  return <Detail 
    isLoading={isLoading}
    navigationTitle={navigationTitle}
    markdown={listSchedule?.join("\n")}
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
          title="학년 반"
          text={preferences?.grade ? preferences?.grade + "학년 " + preferences?.class_nm + "반" : "학년 반 정보가 없습니다."}
        />
        { preferences?.dddep && <Detail.Metadata.Label
          title="학과"
          text={preferences?.dddep}
        /> }
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
