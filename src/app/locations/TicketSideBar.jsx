import { useEffect, useState, Suspense } from 'react'
import { useClient } from '../hooks/useClient'
// import { Button } from '@zendeskgarden/react-buttons'
import { Grid } from '@zendeskgarden/react-grid'
import { Accordion } from '@zendeskgarden/react-accordions'
import { SM, Span, XL } from '@zendeskgarden/react-typography'
import styled from 'styled-components'

const TicketSideBar = () => {
  const client = useClient()
  const [settings, setSettings] = useState({})
  const [userInfo, setUserInfo] = useState({})
  const [policyNumber, setPolicyNumber] = useState('')

  // const handleNewInstance = () => {
  //   client.invoke('instances.create', {
  //     location: 'modal',
  //     url: import.meta.env.VITE_ZENDESK_LOCATION,
  //     size: {
  //       width: '650px',
  //       height: '400px'
  //     }
  //   })
  // }

  const getAppData = () => {
    client.metadata().then(({ settings }) => {
      setSettings(settings)
    })
    client
      .get(['ticket.requester.id', 'ticket.customField:custom_field_40262925004179'])
      .then(({ 'ticket.requester.id': userId, ...data }) => {
        client
          .request({
            url: `/api/v2/users/${userId}.json`,
            type: 'GET',
            contentType: 'application/json'
          })
          .then(({ user }) => {
            setPolicyNumber(data['ticket.customField:custom_field_40262925004179'])
            setUserInfo(user)
          })
      })
  }

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '450px' })
    getAppData()
  }, [client])

  return (
    <Grid gutters={false}>
      <Grid.Col alignSelf="start" style={{ height: '100dvh' }}>
        <Grid.Row justifyContent="between">
          <XL isBold>Portal Info</XL>
          <SM isBold>#{policyNumber}</SM>
        </Grid.Row>
        <Suspense fallback={<span>Loading...</span>}>
          <Accordion defaultExpandedSections={[0]} isCompact level={4}>
            {settings?.fields &&
              settings?.sections.split(',').map((section, index) => {
                const sectionPanels = settings.fields
                  .split(';')
                  [index]?.split(',')
                  .map((displayField, displayFieldIndex) => {
                    if (
                      Object.keys(userInfo).includes(displayField) ||
                      (userInfo?.user_fields && Object.keys(userInfo.user_fields).includes(displayField))
                    ) {
                      return (
                        <AccordionPanel key={`${displayField}-${displayFieldIndex}`}>
                          <Grid.Row justifyContent="between">
                            <Span isBold>{displayField}:</Span>
                            <Span>{userInfo[displayField]}</Span>
                          </Grid.Row>
                        </AccordionPanel>
                      )
                    } else {
                      return (
                        <AccordionPanel key={`${displayField}-${displayFieldIndex}`}>
                          <Span isBold>{displayField}:</Span>
                          <Span>{userInfo[displayField]}</Span>
                        </AccordionPanel>
                      )
                    }
                  })

                return (
                  <AccordionSection key={`${index}-${section}`}>
                    <Accordion.Header style={{ backgroundColor: 'kale' }}>
                      <Accordion.Label style={{ backgroundColor: 'kale' }}>{section}</Accordion.Label>
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
