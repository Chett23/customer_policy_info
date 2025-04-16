import { useEffect, useState, Suspense } from 'react'
import { useClient } from '../hooks/useClient'
// import { Button } from '@zendeskgarden/react-buttons'
import { Grid } from '@zendeskgarden/react-grid'
import { Accordion } from '@zendeskgarden/react-accordions'
import { MD, Span, XL } from '@zendeskgarden/react-typography'
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
        const flattenedPolicyResponse = Object.keys(policyResponse).reduce((newObj, section, sectionIndex) => {
          if (Array.isArray(policyResponse[section])) {
            policyResponse[section].forEach((arrObj) => {
              newObj[`Claim ID: ${arrObj.claimID}`] = arrObj
            })
          } else {
            newObj[section] = policyResponse[section]
          }
          return newObj
        }, {})

        setPolicyInfo(flattenedPolicyResponse)
        setPolicyNumber(data['ticket.customField:custom_field_40262925004179'])

        client.metadata().then(({ settings }) => {
          setSettings(settings)
          setDisplaySections(
            settings.sections === 'all' ? Object.keys(flattenedPolicyResponse) : settings.sections.split(',')
          )
        })
      })
  }

  const getPolicyInfo = (policyNumber) => {
    // make GET request to portal/database here
    return policyDataBase[policyNumber]
  }

  const setSectionPanels = (displayFields, section) => {
    const sectionPanels = displayFields.map(
      (displayField, displayFieldIndex) =>
        Object.keys(policyInfo[section]).includes(displayField) && (
          <AccordionPanel key={`${displayField}-${displayFieldIndex}`}>
            <Grid.Row justifyContent="between">
              <Span isBold>{displayField}:</Span>
              <Span>{`${policyInfo[section][displayField]}`}</Span>
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
                const displayFields =
                  settings.fields === 'all' ? Object.keys(policyInfo[section]) : settings.fields.split(',')
                const sectionPanels = setSectionPanels(displayFields, section)
                return (
                  <AccordionSection key={`${index}-${section}`}>
                    <Accordion.Header>
                      <Accordion.Label>
                        {/* capitalized the First letter of the titles */}
                        {section.replace(/^./, (s) => s.toUpperCase())}
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
