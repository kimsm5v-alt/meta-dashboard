import styled from '@emotion/styled'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../Header'
import { Sidebar } from '../Sidebar'

const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`

const MainWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const MainContent = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`

export const PageLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setIsSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <LayoutWrapper>
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <MainWrapper>
        <Header onMenuClick={handleMenuClick} />
        <MainContent>
          <Outlet />
        </MainContent>
      </MainWrapper>
    </LayoutWrapper>
  )
}
