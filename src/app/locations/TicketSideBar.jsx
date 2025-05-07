import { useEffect, useState, Suspense } from 'react'
import { useClient } from '../hooks/useClient'
// import { Button } from '@zendeskgarden/react-buttons'
import { Grid } from '@zendeskgarden/react-grid'
import { Accordion } from '@zendeskgarden/react-accordions'
import { MD, SM, LG, XL } from '@zendeskgarden/react-typography'
import styled from 'styled-components'
import policyDataBase from '../../assets/data/moc_data.json'

const TicketSideBar = () => {
  const client = useClient()
  const [settings, setSettings] = useState({})
  // const [userInfo, setUserInfo] = useState({})
  const [policyNumber, setPolicyNumber] = useState('')
  const [policyInfo, setPolicyInfo] = useState({})
  const [displaySections, setDisplaySections] = useState([])

  const getAppData = () => {
    client
      .get(['ticket.requester.id', 'ticket.customField:custom_field_40262925004179'])
      .then(({ 'ticket.requester.id': userId, ...data }) => {
        const policyResponse = getPolicyInfo(data['ticket.customField:custom_field_40262925004179'])
        setPolicyInfo(policyResponse)
        setPolicyNumber(data['ticket.customField:custom_field_40262925004179'])

        client.metadata().then(({ settings }) => {
          setSettings(settings)
          setDisplaySections(settings.sections === 'all' ? Object.keys(policyResponse) : settings.sections.split(','))
        })
      })
  }

  const getPolicyInfo = (policyNumber) => {
    // make GET request to portal/database here
    return policyDataBase[policyNumber]
  }

  const setSectionPanels = (section) => {
    const displayFields = settings.fields === 'all' ? Object.keys(section) : settings.fields.split(',')
    const sectionPanels = displayFields.map(
      (displayField, displayFieldIndex) =>
        Object.keys(section).includes(displayField) && (
          <AccordionPanel key={`${displayField}-${displayFieldIndex}`}>
            <Grid.Row justifyContent="between">
              <MD isBold>{displayField}:</MD>
              <SM>{}</SM>
            </Grid.Row>
          </AccordionPanel>
        )
    )
    return sectionPanels
  }

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '750px' })
    getAppData()
  }, [client])

  return (
    <Grid gutters={false}>
      <Grid.Col alignSelf="start" style={{ height: '100dvh' }}>
        <Grid.Row justifyContent="between">
          <XL isBold>Portal Info</XL>
          <MD isBold>#{policyNumber}</MD>
        </Grid.Row>
        <Suspense fallback={<span>Loading...</span>}>
          <Accordion defaultExpandedSections={[0]} isCompact level={4}>
            {policyInfo &&
              displaySections.map((section, index) => {
                let sectionPanels
                if (Array.isArray(policyInfo[section])) {
                  // SubSectionLogic
                  sectionPanels = (
                    <AccordionPanel>
                      <Accordion isCompact level={4}>
                        {policyInfo[section].map((subSectionObj, index) => {
                          const subSectionPanels = setSectionPanels(subSectionObj)
                          return (
                            <AccordionSection key={`${index}-${section}-${subSectionObj.claimID}`}>
                              <Accordion.Header>
                                <Accordion.Label>
                                  <MD isBold>Claim {subSectionObj.claimID.replace(/^./, (s) => s.toUpperCase())}</MD>
                                </Accordion.Label>
                              </Accordion.Header>
                              {subSectionPanels}
                            </AccordionSection>
                          )
                        })}
                      </Accordion>
                    </AccordionPanel>
                  )
                } else {
                  sectionPanels = setSectionPanels(policyInfo[section])
                }
                return (
                  <AccordionSection key={`${index}-${section}`}>
                    <Accordion.Header>
                      <Accordion.Label>
                        {/* capitalized the First letter of the titles */}
                        <LG isBold>{section.replace(/^./, (s) => s.toUpperCase())}</LG>
                      </Accordion.Label>
                    </Accordion.Header>
                    {sectionPanels}
                  </AccordionSection>
                )
              })}
          </Accordion>
        </Suspense>
      </Grid.Col>
    </Grid>
  )
}

const AccordionSection = styled(Accordion.Section)`
  background-color: #ded6f5;
  border-radius: 8px;
`
const AccordionPanel = styled(Accordion.Panel)`
  background-color: #ffffff;
  border-radius: 0px;
`

export default TicketSideBar
