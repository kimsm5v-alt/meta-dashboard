package com.vs.meta.common.controller;

import io.swagger.v3.oas.annotations.Hidden;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
@Controller
public class IndexController {

    @Hidden
    @RequestMapping("/")
    @ResponseBody
    public String index() {
        return "200OK";
    }

    @Hidden
    @RequestMapping(value = "/robots.txt")
    @ResponseBody
    public void robotsBlock(HttpServletRequest request, HttpServletResponse response) {
        try {
            response.getWriter().write("User-agent: *\nDisallow: /\n");
        } catch (IOException e) {
            log.info("exception : {}", e.getMessage());
        }
    }
}
